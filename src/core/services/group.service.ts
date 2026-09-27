import xlsx from 'xlsx';
import { sessionManager } from '../engine/session.manager';
import { GroupInfo } from '../engine/engine.interface';
import { logger } from '../../utils/logger';

export class GroupService {
  public async getGroups(sessionId: string): Promise<GroupInfo[]> {
    const session = sessionManager.getSession(sessionId);
    return await session.getGroups();
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
}

export const groupService = new GroupService();
