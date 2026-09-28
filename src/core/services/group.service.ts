import xlsx from 'xlsx';
import { sessionManager } from '../engine/session.manager';
import { contactRepository } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { GroupInfo } from '../engine/engine.interface';
import { logger } from '../../utils/logger';

export class GroupService {
  public async getGroups(sessionId: string): Promise<GroupInfo[]> {
    const session = sessionManager.getSession(sessionId);
    const botPhone = session.getMetadata()?.phoneNumber;
    const groups = await session.getGroups();

    // Cache groups into local database for instant chat name resolution & admin check
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO groups (id, session_id, jid, name, topic, owner_jid, member_count, is_admin, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, jid) DO UPDATE SET
          name = excluded.name,
          topic = excluded.topic,
          owner_jid = excluded.owner_jid,
          member_count = excluded.member_count,
          is_admin = excluded.is_admin,
          updated_at = excluded.updated_at
      `);

      const tx = db.transaction((items: GroupInfo[]) => {
        for (const g of items) {
          const botParticipant = botPhone ? g.participants.find((p) => p.phone === botPhone || p.jid.includes(botPhone)) : undefined;
          const isAdmin = botParticipant ? (botParticipant.role === 'admin' || botParticipant.role === 'superadmin') : false;

          stmt.run(
            `${sessionId}_${g.jid}`,
            sessionId,
            g.jid,
            g.name,
            g.topic || null,
            g.ownerJid || null,
            g.memberCount || 0,
            isAdmin ? 1 : 0,
            Date.now()
          );
        }
      });
      tx(groups);
    } catch (err: any) {
      logger.warn({ sessionId, err: err?.message }, 'Failed to cache groups in database');
    }

    return groups;
  }

  public isGroupAutoReplyAllowed(sessionId: string, groupJid: string): boolean {
    const db = getDatabase();
    try {
      const row = db.prepare('SELECT is_admin, auto_reply_enabled FROM groups WHERE session_id = ? AND jid = ?').get(sessionId, groupJid) as any;
      if (!row) return false;
      return Boolean(row.is_admin === 1 || row.auto_reply_enabled === 1);
    } catch {
      return false;
    }
  }

  public setGroupAutoReply(sessionId: string, groupJid: string, enabled: boolean): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE groups SET auto_reply_enabled = ?, updated_at = ?
      WHERE session_id = ? AND jid = ?
    `).run(enabled ? 1 : 0, Date.now(), sessionId, groupJid);
  }

  public getCachedGroups(sessionId: string): Array<{
    jid: string;
    name: string;
    topic?: string;
    memberCount: number;
    isAdmin: boolean;
    autoReplyEnabled: boolean;
  }> {
    const db = getDatabase();
    const rows = db.prepare('SELECT jid, name, topic, member_count, is_admin, auto_reply_enabled FROM groups WHERE session_id = ? ORDER BY name ASC').all(sessionId) as any[];
    return rows.map((r) => ({
      jid: r.jid,
      name: r.name,
      topic: r.topic || undefined,
      memberCount: r.member_count || 0,
      isAdmin: Boolean(r.is_admin === 1),
      autoReplyEnabled: Boolean(r.auto_reply_enabled === 1)
    }));
  }

  public async getGroupMetadata(sessionId: string, groupJid: string): Promise<GroupInfo> {
    const session = sessionManager.getSession(sessionId);
    return await session.getGroupMetadata(groupJid);
  }

  public async exportGroupMembersToExcel(sessionId: string, groupJid: string): Promise<{ buffer: Buffer; groupName: string }> {
    const group = await this.getGroupMetadata(sessionId, groupJid);
    const rows = group.participants.map((p) => ({
      Phone: p.phone,
      Role: p.role,
      Jid: p.jid,
      GroupName: group.name
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Members');
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info({ sessionId, groupJid, memberCount: rows.length }, 'Exported group members to Excel');
    return { buffer, groupName: group.name };
  }

  public async importGroupMembersToContacts(sessionId: string, groupJid: string): Promise<{ count: number; groupName: string }> {
    const group = await this.getGroupMetadata(sessionId, groupJid);
    const db = getDatabase();
    let count = 0;

    // Perf fix: wrap all upserts in a single transaction (was N separate writes + N fsyncs)
    const tx = db.transaction(() => {
      for (const p of group.participants) {
        if (!p.phone || p.phone.length < 7) continue;
        let cleanPhone = p.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('8')) {
          cleanPhone = '62' + cleanPhone;
        }
        contactRepository.upsert({
          sessionId,
          jid: `${cleanPhone}@s.whatsapp.net`,
          phone: cleanPhone,
          name: `Member ${group.name}`,
          tags: ['Grup', group.name]
        });
        count++;
      }
    });
    tx();

    logger.info({ sessionId, groupJid, count }, 'Imported group members to contacts');
    return { count, groupName: group.name };
  }
}

export const groupService = new GroupService();
