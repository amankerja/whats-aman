const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.resolve('./data/database.sqlite');
const sessionsDir = path.resolve('./data/sessions');

console.log('Connecting to database:', dbPath);
const db = new Database(dbPath);

// 1. Collect all reverse mappings from disk across all sessions
const lidMap = new Map();
if (fs.existsSync(sessionsDir)) {
  const sessionDirs = fs.readdirSync(sessionsDir);
  for (const sDir of sessionDirs) {
    const authDir = path.join(sessionsDir, sDir, 'auth');
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir).filter(f => f.startsWith('lid-mapping-') && f.endsWith('_reverse.json'));
      console.log(`Scanning session [${sDir}]: found ${files.length} reverse mapping files.`);
      for (const file of files) {
        const lid = file.replace('lid-mapping-', '').replace('_reverse.json', '');
        try {
          const raw = fs.readFileSync(path.join(authDir, file), 'utf-8');
          const phone = JSON.parse(raw);
          if (typeof phone === 'string' && /^\d{7,16}$/.test(phone)) {
            lidMap.set(lid, phone);
          }
        } catch {}
      }
    }
  }
}
console.log(`Total unique LID mappings loaded: ${lidMap.size}`);

// 2. Perform Migration
let resolvedContacts = 0;
let mergedDuplicates = 0;
let updatedContacts = 0;
let unresolvableCount = 0;
let messagesChatUpdated = 0;
let messagesSenderUpdated = 0;

const contacts = db.prepare('SELECT * FROM contacts').all();
console.log(`Total contacts in database before migration: ${contacts.length}`);

const deleteStmt = db.prepare('DELETE FROM contacts WHERE id = ?');
const updateStmt = db.prepare(`
  UPDATE contacts 
  SET id = ?, jid = ?, phone = ?, name = COALESCE(name, ?), push_name = COALESCE(push_name, ?), updated_at = ?
  WHERE id = ?
`);
const mergeStmt = db.prepare(`
  UPDATE contacts
  SET 
    name = CASE WHEN (name IS NULL OR name = '' OR name = '-') AND @name IS NOT NULL AND @name != '' AND @name != '-' THEN @name ELSE name END,
    push_name = COALESCE(push_name, @push_name),
    notes = CASE WHEN (notes IS NULL OR notes = '') AND @notes IS NOT NULL THEN @notes ELSE notes END,
    deal_value = CASE WHEN (deal_value IS NULL OR deal_value = 0) AND @deal_value > 0 THEN @deal_value ELSE deal_value END,
    pipeline_stage = CASE WHEN (pipeline_stage IS NULL OR pipeline_stage = 'lead') AND @pipeline_stage != 'lead' THEN @pipeline_stage ELSE pipeline_stage END
  WHERE id = @target_id
`);

const findNameInMessagesStmt = db.prepare(`
  SELECT push_name FROM messages 
  WHERE session_id = ? AND (sender_jid LIKE ? OR chat_jid LIKE ?)
    AND push_name IS NOT NULL AND TRIM(push_name) != ''
  LIMIT 1
`);

const tx = db.transaction(() => {
  for (const c of contacts) {
    const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
    const cleanJid = (c.jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

    const isLid = lidMap.has(cleanPhone) || lidMap.has(cleanJid) || cleanPhone.length >= 14 || (cleanPhone.length >= 12 && cleanPhone.startsWith('10'));
    if (!isLid) continue;

    const realPhone = lidMap.get(cleanPhone) || lidMap.get(cleanJid);
    if (realPhone) {
      resolvedContacts++;
      // Check if contact already exists with this realPhone in same session
      const existing = db.prepare(`
        SELECT * FROM contacts 
        WHERE session_id = ? AND (phone = ? OR jid = ?) AND id != ?
      `).get(c.session_id, realPhone, `${realPhone}@s.whatsapp.net`, c.id);

      if (existing) {
        // Merge metadata and delete duplicate
        mergeStmt.run({
          name: c.name,
          push_name: c.push_name,
          notes: c.notes,
          deal_value: c.deal_value || 0,
          pipeline_stage: c.pipeline_stage || 'lead',
          target_id: existing.id
        });
        deleteStmt.run(c.id);
        mergedDuplicates++;
      } else {
        // Update to real phone
        let recoveredName = c.name;
        let recoveredPushName = c.push_name;
        if (!recoveredName) {
          const msg = findNameInMessagesStmt.get(c.session_id, `%${cleanPhone}%`, `%${cleanPhone}%`);
          if (msg && msg.push_name) {
            recoveredName = msg.push_name;
            recoveredPushName = msg.push_name;
          }
        }
        const newCanonicalJid = `${realPhone}@s.whatsapp.net`;
        const newId = `${c.session_id}:${newCanonicalJid}`;
        updateStmt.run(newId, newCanonicalJid, realPhone, recoveredName || null, recoveredPushName || null, Date.now(), c.id);
        updatedContacts++;
      }
    } else {
      unresolvableCount++;
      // Unresolvable LID: check if messages have a push_name
      if (!c.name) {
        const msg = findNameInMessagesStmt.get(c.session_id, `%${cleanPhone}%`, `%${cleanPhone}%`);
        if (msg && msg.push_name) {
          db.prepare('UPDATE contacts SET name = ?, push_name = ? WHERE id = ?').run(msg.push_name, msg.push_name, c.id);
        }
      }
    }
  }

  // 3. Migrate messages table chat_jid and sender_jid that end with @lid
  const msgChatUpdateStmt = db.prepare('UPDATE messages SET chat_jid = ? WHERE id = ?');
  const msgSenderUpdateStmt = db.prepare('UPDATE messages SET sender_jid = ? WHERE id = ?');

  const msgsWithLid = db.prepare("SELECT id, session_id, chat_jid, sender_jid FROM messages WHERE chat_jid LIKE '%@lid' OR sender_jid LIKE '%@lid'").all();
  console.log(`Processing ${msgsWithLid.length} messages with @lid...`);

  for (const m of msgsWithLid) {
    if (m.chat_jid && m.chat_jid.endsWith('@lid')) {
      const cleanLid = m.chat_jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      const realPhone = lidMap.get(cleanLid);
      if (realPhone) {
        msgChatUpdateStmt.run(`${realPhone}@s.whatsapp.net`, m.id);
        messagesChatUpdated++;
      }
    }
    if (m.sender_jid && m.sender_jid.endsWith('@lid')) {
      const cleanLid = m.sender_jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      const realPhone = lidMap.get(cleanLid);
      if (realPhone) {
        msgSenderUpdateStmt.run(`${realPhone}@s.whatsapp.net`, m.id);
        messagesSenderUpdated++;
      }
    }
  }
});

tx();

console.log('\n=== MIGRATION COMPLETE ===');
console.log(`- Resolved LID contacts: ${resolvedContacts}`);
console.log(`- Merged duplicate nameless contacts: ${mergedDuplicates}`);
console.log(`- Updated contacts to real phone numbers: ${updatedContacts}`);
console.log(`- Unresolvable LIDs: ${unresolvableCount}`);
console.log(`- Messages chat_jid updated: ${messagesChatUpdated}`);
console.log(`- Messages sender_jid updated: ${messagesSenderUpdated}`);

const remainingContacts = db.prepare('SELECT count(*) as count FROM contacts').get();
console.log(`\nRemaining unique contacts in database: ${remainingContacts.count}`);

// Verify sample 100270474289202 and 24176505143394
const sampleCheck = db.prepare("SELECT id, session_id, jid, phone, name, push_name FROM contacts WHERE phone = '6282137601347' OR phone = '6285840279414'").all();
console.log('\nVerification of sample contacts after migration:');
console.log(JSON.stringify(sampleCheck, null, 2));
