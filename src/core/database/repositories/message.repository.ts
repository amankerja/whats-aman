import { getDatabase } from '../connection';
import { NormalizedMessage } from '../../events/event.types';

export interface MessageRecord {
  id: string;
  session_id: string;
  message_id: string;
  chat_jid: string;
  sender_jid: string;
  from_me: number;
  push_name?: string;
  content_text?: string;
  media_type?: string;
  media_url?: string;
  caption?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: number;
  created_at: number;
}

export class MessageRepository {
  private stmtCache = new Map<string, any>();

  private get db() {
    return getDatabase();
  }

  private getStatement(key: string, sql: string) {
    let stmt = this.stmtCache.get(key);
    if (!stmt) {
      stmt = this.db.prepare(sql);
      this.stmtCache.set(key, stmt);
    }
    return stmt;
  }

  public save(msg: NormalizedMessage, status: MessageRecord['status'] = 'SENT'): void {
    const stmt = this.getStatement('save_msg', `
      INSERT OR REPLACE INTO messages (
        id, session_id, message_id, chat_jid, sender_jid, from_me, push_name,
        content_text, media_type, media_url, caption, status, timestamp, created_at
      ) VALUES (
        @id, @session_id, @message_id, @chat_jid, @sender_jid, @from_me, @push_name,
        @content_text, @media_type, @media_url, @caption, @status, @timestamp, @created_at
      )
    `);

    stmt.run({
      id: `${msg.sessionId}:${msg.id}`,
      session_id: msg.sessionId,
      message_id: msg.id,
      chat_jid: msg.chatJid,
      sender_jid: msg.senderJid,
      from_me: msg.fromMe ? 1 : 0,
      push_name: msg.pushName || null,
      content_text: msg.text || null,
      media_type: msg.mediaType || null,
      media_url: msg.mediaUrl || null,
      caption: msg.caption || null,
      status,
      timestamp: msg.timestamp,
      created_at: Date.now()
    });
  }

  public updateStatus(sessionId: string, messageId: string, status: MessageRecord['status']): void {
    const stmt = this.getStatement('update_status', `
      UPDATE messages SET status = ? WHERE session_id = ? AND message_id = ?
    `);
    stmt.run(status, sessionId, messageId);
  }

  public updateMediaUrl(sessionId: string, messageId: string, mediaUrl: string): void {
    const stmt = this.getStatement('update_media', `
      UPDATE messages SET media_url = ? WHERE session_id = ? AND message_id = ?
    `);
    stmt.run(mediaUrl, sessionId, messageId);
  }

  public findByMessageId(sessionId: string, messageId: string): MessageRecord | undefined {
    const stmt = this.getStatement('find_by_msg_id', 'SELECT * FROM messages WHERE session_id = ? AND message_id = ?');
    return stmt.get(sessionId, messageId) as MessageRecord | undefined;
  }

  public findByChat(sessionId: string, chatJid: string | string[], limit = 100, offset = 0): MessageRecord[] {
    const jids = Array.isArray(chatJid) ? chatJid : [chatJid];
    const placeholders = jids.map(() => '?').join(',');
    const cacheKey = `find_by_chat_${jids.length}`;
    const stmt = this.getStatement(cacheKey, `
      SELECT * FROM (
        SELECT * FROM messages
        WHERE session_id = ? AND chat_jid IN (${placeholders})
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      ) ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId, ...jids, limit, offset) as MessageRecord[];
  }

  public findRecentChats(sessionId: string, limit = 50): Array<{
    chat_jid: string;
    last_message: string;
    last_from_me: number;
    last_status: string;
    timestamp: number;
    name?: string;
    push_name?: string;
    unread_count?: number;
  }> {
    const stmt = this.getStatement('find_recent_chats', `
      WITH RankedMessages AS (
        SELECT 
          m.*,
          ROW_NUMBER() OVER(PARTITION BY m.chat_jid ORDER BY m.timestamp DESC) as rn
        FROM messages m
        WHERE m.session_id = ? AND m.chat_jid != 'status@broadcast' AND m.chat_jid NOT LIKE '%@broadcast'
      ),
      ContactPushNames AS (
        SELECT 
          chat_jid,
          push_name as peer_push_name,
          ROW_NUMBER() OVER(PARTITION BY chat_jid ORDER BY timestamp DESC) as prn
        FROM messages
        WHERE session_id = ? AND from_me = 0 AND push_name IS NOT NULL AND TRIM(push_name) != ''
      )
      SELECT 
        rm.chat_jid,
        COALESCE(
          rm.content_text,
          rm.caption,
          CASE 
            WHEN rm.media_type = 'image' THEN '📷 Foto'
            WHEN rm.media_type = 'video' THEN '🎥 Video'
            WHEN rm.media_type = 'audio' THEN '🎵 Pesan suara'
            WHEN rm.media_type = 'document' THEN '📄 Dokumen'
            WHEN rm.media_type = 'sticker' THEN 'Stiker'
            ELSE 'Pesan'
          END
        ) as last_message,
        rm.from_me as last_from_me,
        rm.status as last_status,
        rm.timestamp as timestamp,
        COALESCE(
          g.name,
          c.name,
          c.push_name,
          CASE WHEN rm.chat_jid NOT LIKE '%@g.us' THEN cpn.peer_push_name ELSE NULL END
        ) as name,
        CASE 
          WHEN rm.chat_jid LIKE '%@g.us' THEN NULL 
          ELSE COALESCE(c.push_name, cpn.peer_push_name) 
        END as push_name,
        COALESCE(unreads.unread_count, 0) as unread_count
      FROM RankedMessages rm
      LEFT JOIN contacts c ON c.session_id = rm.session_id AND c.jid = rm.chat_jid
      LEFT JOIN groups g ON g.session_id = rm.session_id AND g.jid = rm.chat_jid
      LEFT JOIN (
        SELECT chat_jid, peer_push_name
        FROM ContactPushNames
        WHERE prn = 1
      ) cpn ON cpn.chat_jid = rm.chat_jid
      LEFT JOIN (
        SELECT chat_jid, COUNT(*) as unread_count
        FROM messages
        WHERE session_id = ? AND from_me = 0 AND status != 'READ'
        GROUP BY chat_jid
      ) unreads ON unreads.chat_jid = rm.chat_jid
      WHERE rm.rn = 1
      ORDER BY rm.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, sessionId, sessionId, limit) as any;
  }
}

export const messageRepository = new MessageRepository();
