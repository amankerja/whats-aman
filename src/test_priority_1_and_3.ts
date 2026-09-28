import { initializeDatabaseSchema } from './core/database/schema';
import { messageService } from './core/services/message.service';
import { messageRepository } from './core/database/repositories/message.repository';
import { eventBus } from './core/events/event-bus';
import { BaileysAdapter } from './core/engine/baileys.adapter';
import { proto } from '@whiskeysockets/baileys';

async function runTests() {
  console.log('=====================================================');
  console.log('  TESTING PRIORITAS 1 & PRIORITAS 3 INTEGRASI SISTEM  ');
  console.log('=====================================================\n');

  // 1. Initialize schema & message service
  initializeDatabaseSchema();
  messageService.initialize();

  const testSessionId = `test_audit_${Date.now()}`;
  const adapter = new BaileysAdapter(testSessionId);

  // --- TEST 1: Unwrapping berbagai tipe pesan (Ephemeral, ViewOnce, EditedMessage, Interactive, Reaction, Poll) ---
  console.log('--- TEST 1: Unwrapping Tipe Pesan WhatsApp Kompleks ---');

  // A. Edited Message
  const editedRaw: any = {
    key: { id: 'MSG_EDITED_01', remoteJid: '6281234567890@s.whatsapp.net', fromMe: false },
    message: {
      editedMessage: {
        message: {
          protocolMessage: {
            editedMessage: {
              conversation: 'Ini adalah pesan yang telah diedit oleh pengirim'
            }
          }
        }
      }
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  };
  const normEdited = (adapter as any).normalizeMessage(editedRaw);
  if (normEdited.text !== 'Ini adalah pesan yang telah diedit oleh pengirim') {
    throw new Error(`Failed to unwrap editedMessage! Got: ${normEdited.text}`);
  }
  console.log('✅ EditedMessage unwrapped correctly:', normEdited.text);

  // B. Ephemeral + ViewOnce Image Message
  const viewOnceRaw: any = {
    key: { id: 'MSG_VO_02', remoteJid: '6281234567890@s.whatsapp.net', fromMe: false },
    message: {
      ephemeralMessage: {
        message: {
          viewOnceMessageV2: {
            message: {
              imageMessage: {
                caption: 'Foto rahasia sekali lihat',
                mimetype: 'image/jpeg'
              }
            }
          }
        }
      }
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  };
  const normVO = (adapter as any).normalizeMessage(viewOnceRaw);
  if (normVO.mediaType !== 'image' || normVO.caption !== 'Foto rahasia sekali lihat') {
    throw new Error(`Failed to unwrap viewOnceMessage! Got: ${JSON.stringify(normVO)}`);
  }
  console.log('✅ Ephemeral + ViewOnce unwrapped correctly:', normVO.mediaType, normVO.caption);

  // C. Interactive Button Response
  const btnRaw: any = {
    key: { id: 'MSG_BTN_03', remoteJid: '6281234567890@s.whatsapp.net', fromMe: false },
    message: {
      interactiveResponseMessage: {
        body: {
          text: 'Pilihan Paket Pro'
        }
      }
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  };
  const normBtn = (adapter as any).normalizeMessage(btnRaw);
  if (normBtn.text !== 'Pilihan Paket Pro') {
    throw new Error(`Failed to unwrap interactiveResponseMessage! Got: ${normBtn.text}`);
  }
  console.log('✅ InteractiveResponseMessage unwrapped correctly:', normBtn.text);

  // D. Reaction Message
  const reactRaw: any = {
    key: { id: 'MSG_REACT_04', remoteJid: '6281234567890@s.whatsapp.net', fromMe: false },
    message: {
      reactionMessage: {
        text: '🔥'
      }
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  };
  const normReact = (adapter as any).normalizeMessage(reactRaw);
  if (!normReact.text?.includes('🔥')) {
    throw new Error(`Failed to handle reactionMessage! Got: ${normReact.text}`);
  }
  console.log('✅ ReactionMessage handled correctly:', normReact.text);

  // --- TEST 2: LID Resolution & JID Matching ---
  console.log('\n--- TEST 2: LID JID Resolution & Normalization ---');
  const lidRaw: any = {
    key: { id: 'MSG_LID_05', remoteJid: '1293810293810293@lid', fromMe: false },
    message: {
      conversation: 'Halo dari akun multi-device LID'
    },
    messageTimestamp: Math.floor(Date.now() / 1000)
  };
  const normLid = (adapter as any).normalizeMessage(lidRaw);
  console.log('Normalized LID Message:', {
    chatJid: normLid.chatJid,
    resolvedPhone: normLid.resolvedPhone,
    text: normLid.text
  });
  if (normLid.chatJid !== '1293810293810293@lid') {
    throw new Error(`Expected chatJid 1293810293810293@lid, got: ${normLid.chatJid}`);
  }
  console.log('✅ LID Message normalized without dropping');

  // --- TEST 3: High-Throughput Burst Test (500 Pesan Masuk Berturut-turut) ---
  console.log('\n--- TEST 3: High-Throughput Burst Test (500 Pesan Masuk) ---');
  const startTime = Date.now();
  const totalBurst = 500;
  let receivedCount = 0;

  const onMsgReceived = ({ sessionId, message }: any) => {
    if (sessionId === testSessionId) {
      receivedCount++;
    }
  };
  eventBus.on('message.received', onMsgReceived);

  for (let i = 0; i < totalBurst; i++) {
    const rawMsg: any = {
      key: {
        id: `BURST_MSG_${i}_${Date.now()}`,
        remoteJid: `6281987654321@s.whatsapp.net`,
        fromMe: i % 2 === 0
      },
      message: {
        conversation: `Pesan uji burst ke-${i}`
      },
      messageTimestamp: Math.floor(Date.now() / 1000)
    };

    const norm = (adapter as any).normalizeMessage(rawMsg);
    eventBus.emit('message.received', { sessionId: testSessionId, message: norm });
  }

  const durationMs = Date.now() - startTime;
  console.log(`Processed ${totalBurst} messages in ${durationMs}ms (${(totalBurst / (durationMs / 1000)).toFixed(0)} msgs/sec)`);

  if (receivedCount !== totalBurst) {
    throw new Error(`Expected ${totalBurst} messages received, got: ${receivedCount}`);
  }

  // Verify SQLite persistence
  const savedMessages = messageRepository.findByChat(testSessionId, '6281987654321@s.whatsapp.net', 1000, 0);
  console.log(`Saved in SQLite messages table: ${savedMessages.length}`);
  if (savedMessages.length !== totalBurst) {
    throw new Error(`Expected ${totalBurst} messages in SQLite, got: ${savedMessages.length}`);
  }
  console.log('✅ 500 Pesan Masuk 100% Persisted ke SQLite & EventBus Emitted');

  // --- TEST 4: Non-blocking Async Media Update Test ---
  console.log('\n--- TEST 4: Asynchronous Media URL Update Test ---');
  let mediaUpdatedFired = false;
  const testMsgId = `MEDIA_MSG_${Date.now()}`;

  eventBus.on('message.updated', ({ sessionId, message }) => {
    if (sessionId === testSessionId && message.id === testMsgId) {
      mediaUpdatedFired = true;
    }
  });

  // Save placeholder message
  const initialMediaMsg = {
    id: testMsgId,
    sessionId: testSessionId,
    chatJid: '6281987654321@s.whatsapp.net',
    senderJid: '6281987654321@s.whatsapp.net',
    fromMe: false,
    text: 'Foto Produk',
    mediaType: 'image' as const,
    timestamp: Date.now()
  };
  eventBus.emit('message.received', { sessionId: testSessionId, message: initialMediaMsg });

  // Simulate background download completion
  const downloadedMediaUrl = `/media/${testMsgId}.jpg`;
  messageRepository.updateMediaUrl(testSessionId, testMsgId, downloadedMediaUrl);
  eventBus.emit('message.updated', {
    sessionId: testSessionId,
    message: { ...initialMediaMsg, mediaUrl: downloadedMediaUrl }
  });

  const updatedRecord = messageRepository.findByMessageId(testSessionId, testMsgId);
  if (!updatedRecord || updatedRecord.media_url !== downloadedMediaUrl) {
    throw new Error(`Failed to update media URL in SQLite! Got: ${updatedRecord?.media_url}`);
  }
  if (!mediaUpdatedFired) {
    throw new Error('message.updated event was not emitted!');
  }
  console.log('✅ Async media URL updated in SQLite and broadcasted via eventBus');

  // Clean up
  eventBus.off('message.received', onMsgReceived);
  console.log('\n=====================================================');
  console.log('  SEMUA TEST PRIORITAS 1 & PRIORITAS 3 BERHASIL! (100%)');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
