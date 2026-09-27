import { getDatabase } from '../connection';
import { NormalizedMessage } from '../../events/event.types';

export interface MessageRecord {
  id: string;
  session_id: string;
  message_id: string;
  chat_jid: string;
  sender_jid: string;
  from_me: number;
  content_text?: string;
  media_type?: string;
  media_url?: string;
  caption?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: number;
  created_at: number;
}

export class MessageRepository {
  private get db() {
    return getDatabase();
  }

  public save(msg: NormalizedMessage, status: MessageRecord['status'] = 'SENT'): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO messages (
        id, session_id, message_id, chat_jid, sender_jid, from_me,
        content_text, media_type, media_url, caption, status, timestamp, created_at
      ) VALUES (
        @id, @session_id, @message_id, @chat_jid, @sender_jid, @from_me,
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
    const stmt = this.db.prepare(`
      UPDATE messages SET status = ? WHERE session_id = ? AND message_id = ?
    `);
    stmt.run(status, sessionId, messageId);
  }

  public findByChat(sessionId: string, chatJid: string, limit = 100, offset = 0): MessageRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM (
        SELECT * FROM messages
        WHERE session_id = ? AND chat_jid = ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      ) ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId, chatJid, limit, offset) as MessageRecord[];
  }

  public findRecentChats(sessionId: string, limit = 50): Array<{
    chat_jid: string;
    last_message: string;
    timestamp: number;
    name?: string;
    push_name?: string;
    unread_count?: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT 
        m.chat_jid,
        m.content_text as last_message,
        MAX(m.timestamp) as timestamp,
        c.name as name,
        c.push_name as push_name,
        SUM(CASE WHEN m.from_me = 0 AND m.status != 'READ' THEN 1 ELSE 0 END) as unread_count
      FROM messages m
      LEFT JOIN contacts c ON c.session_id = m.session_id AND c.jid = m.chat_jid
      WHERE m.session_id = ?
      GROUP BY m.chat_jid
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    return stmt.all(sessionId, limit) as any;
  }
}

export const messageRepository = new MessageRepository();
