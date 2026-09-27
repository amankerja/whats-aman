import xlsx from 'xlsx';
import { sessionManager } from '../engine/session.manager';
import { contactRepository } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { GroupInfo } from '../engine/engine.interface';
import { logger } from '../../utils/logger';

export class GroupService {
  public async getGroups(sessionId: string): Promise<GroupInfo[]> {
    const session = sessionManager.getSession(sessionId);
    const groups = await session.getGroups();

    // Cache groups into local database for instant chat name resolution
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO groups (id, session_id, jid, name, topic, owner_jid, member_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, jid) DO UPDATE SET
          name = excluded.name,
          topic = excluded.topic,
          owner_jid = excluded.owner_jid,
          member_count = excluded.member_count,
          updated_at = excluded.updated_at
      `);

      const tx = db.transaction((items: GroupInfo[]) => {
        for (const g of items) {
          stmt.run(
            `${sessionId}_${g.jid}`,
            sessionId,
            g.jid,
            g.name,
            g.topic || null,
            g.ownerJid || null,
            g.memberCount || 0,
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
    let count = 0;
    for (const p of group.participants) {
      if (!p.phone || p.phone.length < 7) continue;
      const cleanPhone = p.phone.replace(/[^0-9]/g, '');
      contactRepository.upsert({
        sessionId,
        jid: `${cleanPhone}@s.whatsapp.net`,
        phone: cleanPhone,
        name: `Member ${group.name}`,
        tags: ['Grup', group.name]
      });
      count++;
    }
    logger.info({ sessionId, groupJid, count }, 'Imported group members to contacts');
    return { count, groupName: group.name };
  }
}

export const groupService = new GroupService();
