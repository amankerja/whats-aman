import xlsx from 'xlsx';
import { sessionManager } from '../engine/session.manager';
import { contactRepository } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { GroupInfo } from '../engine/engine.interface';
import { logger } from '../../utils/logger';

function formatPhoneReadable(digits: string): string {
  if (!digits) return '';
  const clean = digits.replace(/[^0-9]/g, '');
  if (clean.length <= 4) return `+${clean}`;
  if (clean.startsWith('62') && clean.length >= 9) {
    const rest = clean.slice(2);
    if (rest.length <= 4) return `+62 ${rest}`;
    const part1 = rest.slice(0, 3);
    const part2 = rest.slice(3, 7);
    const part3 = rest.slice(7);
    return `+62 ${part1}-${part2}${part3 ? `-${part3}` : ''}`;
  }
  return `+${clean}`;
}

export class GroupService {
  public async getGroups(sessionId: string): Promise<GroupInfo[]> {
    const session = sessionManager.getSession(sessionId);
    const botPhone = session.getMetadata()?.phoneNumber;
    const groups = await session.getGroups();

    // Cache groups and their members into local database for instant chat resolution, offline export & admin checks
    try {
      const db = getDatabase();
      const groupStmt = db.prepare(`
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

      const memberDeleteStmt = db.prepare(`DELETE FROM group_members WHERE group_id = ?`);
      const memberInsertStmt = db.prepare(`
        INSERT INTO group_members (id, group_id, jid, phone, role)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(group_id, jid) DO UPDATE SET
          phone = excluded.phone,
          role = excluded.role
      `);

      const tx = db.transaction((items: GroupInfo[]) => {
        for (const g of items) {
          const botParticipant = botPhone
            ? g.participants.find((p) => p.phone === botPhone || p.jid.includes(botPhone))
            : undefined;
          const isAdmin = botParticipant ? botParticipant.role === 'admin' || botParticipant.role === 'superadmin' : false;

          const groupId = `${sessionId}_${g.jid}`;
          groupStmt.run(
            groupId,
            sessionId,
            g.jid,
            g.name,
            g.topic || null,
            g.ownerJid || null,
            g.memberCount || (g.participants ? g.participants.length : 0),
            isAdmin ? 1 : 0,
            Date.now()
          );

          if (Array.isArray(g.participants) && g.participants.length > 0) {
            memberDeleteStmt.run(groupId);
            for (const p of g.participants) {
              memberInsertStmt.run(
                `${groupId}_${p.jid}`,
                groupId,
                p.jid,
                p.phone || p.jid.split('@')[0],
                p.role || 'member'
              );
            }
          }
        }
      });
      tx(groups);
    } catch (err: any) {
      logger.warn({ sessionId, err: err?.message }, 'Failed to cache groups and members in database');
    }

    return groups;
  }

  public isGroupAutoReplyAllowed(sessionId: string, groupJid: string): boolean {
    const db = getDatabase();
    try {
      const row = db
        .prepare('SELECT is_admin, auto_reply_enabled FROM groups WHERE session_id = ? AND jid = ?')
        .get(sessionId, groupJid) as any;
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
    const rows = db
      .prepare('SELECT jid, name, topic, member_count, is_admin, auto_reply_enabled FROM groups WHERE session_id = ? ORDER BY name ASC')
      .all(sessionId) as any[];
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

  public async exportGroupMembersToExcel(sessionId: string, groupJid: string): Promise<{ buffer: Buffer; groupName: string; count: number }> {
    let group: GroupInfo | null = null;
    let groupName = 'Grup WhatsApp';
    const db = getDatabase();

    // 1. Try to fetch live group metadata from engine
    try {
      group = await this.getGroupMetadata(sessionId, groupJid);
      groupName = group.name;
    } catch (err: any) {
      logger.warn({ sessionId, groupJid, err: err?.message }, 'Live group metadata fetch failed, checking local group cache');
    }

    // 2. Fallback to cached groups from session or DB if live fetch failed or participants empty
    if (!group || !group.participants || group.participants.length === 0) {
      const cached = this.getCachedGroups(sessionId).find(g => g.jid === groupJid);
      if (cached) {
        groupName = cached.name;
      }

      // Read from group_members SQLite table
      const groupId = `${sessionId}_${groupJid}`;
      const savedMembers = db.prepare('SELECT jid, phone, role FROM group_members WHERE group_id = ?').all(groupId) as any[];

      if (savedMembers && savedMembers.length > 0) {
        group = {
          jid: groupJid,
          name: groupName,
          memberCount: savedMembers.length,
          participants: savedMembers.map(m => ({
            jid: m.jid,
            phone: m.phone,
            role: m.role as any
          }))
        };
      }
    }

    if (!group || !group.participants || group.participants.length === 0) {
      throw new Error(`Data anggota grup "${groupName}" belum tersedia di memori atau database. Pastikan sesi WhatsApp terhubung dan klik tombol Refresh untuk menyinkronkan data grup.`);
    }

    // 3. Enrich participants with saved contact names and proper formatting
    const sessionContacts = db.prepare('SELECT phone, name, push_name FROM contacts WHERE session_id = ?').all(sessionId) as any[];
    const contactsByPhone = new Map<string, any>();
    for (const c of sessionContacts) {
      if (c.phone) contactsByPhone.set(c.phone, c);
    }

    const rows = group.participants.map((p, idx) => {
      let cleanPhone = p.phone ? p.phone.replace(/[^0-9]/g, '') : '';
      if (!cleanPhone && p.jid) {
        cleanPhone = p.jid.replace(/:[0-9]+@/, '@').split('@')[0].replace(/[^0-9]/g, '');
      }

      const savedContact = contactsByPhone.get(cleanPhone);
      const contactName = savedContact?.name || savedContact?.push_name || p.name || '—';
      const roleDisplay = p.role === 'superadmin' ? 'Super Admin' : p.role === 'admin' ? 'Admin' : 'Anggota';
      const formattedPhone = cleanPhone ? formatPhoneReadable(cleanPhone) : '—';
      const isSaved = Boolean(savedContact);

      return {
        'No': idx + 1,
        'Nama Kontak': contactName,
        'Nomor Telepon': cleanPhone || p.jid,
        'Format WhatsApp': formattedPhone,
        'Peran di Grup': roleDisplay,
        'Nama Grup': group!.name,
        'JID WhatsApp': p.jid,
        'Status Kontak': isSaved ? 'Tersimpan di Kontak' : 'Belum Tersimpan'
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(rows);

    // Set column widths for readability in Excel
    worksheet['!cols'] = [
      { wch: 6 },   // No
      { wch: 28 },  // Nama Kontak
      { wch: 20 },  // Nomor Telepon
      { wch: 22 },  // Format WhatsApp
      { wch: 16 },  // Peran di Grup
      { wch: 32 },  // Nama Grup
      { wch: 36 },  // JID WhatsApp
      { wch: 22 }   // Status Kontak
    ];

    const workbook = xlsx.utils.book_new();
    const safeSheetName = (group.name.replace(/[:\\/?*\[\]]/g, '_').slice(0, 30)) || 'Anggota Grup';
    xlsx.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info({ sessionId, groupJid, memberCount: rows.length }, 'Exported group members to Excel successfully');
    return { buffer, groupName: group.name, count: rows.length };
  }

  public async exportAllGroupsToExcel(sessionId: string): Promise<{ buffer: Buffer; totalGroups: number; totalMembers: number }> {
    const groups = await this.getGroups(sessionId);
    if (!groups || groups.length === 0) {
      throw new Error('Tidak ada grup WhatsApp yang ditemukan pada sesi ini. Pastikan akun WhatsApp tergabung dalam minimal 1 grup.');
    }

    const db = getDatabase();
    const sessionContacts = db.prepare('SELECT phone, name, push_name FROM contacts WHERE session_id = ?').all(sessionId) as any[];
    const contactsByPhone = new Map<string, any>();
    for (const c of sessionContacts) {
      if (c.phone) contactsByPhone.set(c.phone, c);
    }

    const workbook = xlsx.utils.book_new();
    const allMembersRows: any[] = [];
    let counter = 1;

    for (const g of groups) {
      for (const p of g.participants) {
        let cleanPhone = p.phone ? p.phone.replace(/[^0-9]/g, '') : '';
        if (!cleanPhone && p.jid) {
          cleanPhone = p.jid.replace(/:[0-9]+@/, '@').split('@')[0].replace(/[^0-9]/g, '');
        }

        const savedContact = contactsByPhone.get(cleanPhone);
        const contactName = savedContact?.name || savedContact?.push_name || p.name || '—';
        const roleDisplay = p.role === 'superadmin' ? 'Super Admin' : p.role === 'admin' ? 'Admin' : 'Anggota';

        allMembersRows.push({
          'No': counter++,
          'Nama Grup': g.name,
          'Nama Kontak': contactName,
          'Nomor Telepon': cleanPhone || p.jid,
          'Format WhatsApp': cleanPhone ? formatPhoneReadable(cleanPhone) : '—',
          'Peran': roleDisplay,
          'JID Grup': g.jid,
          'JID Member': p.jid
        });
      }
    }

    // Sheet 1: Semua Anggota Grup
    const allSheet = xlsx.utils.json_to_sheet(allMembersRows);
    allSheet['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 28 },
      { wch: 20 },
      { wch: 22 },
      { wch: 16 },
      { wch: 32 },
      { wch: 36 }
    ];
    xlsx.utils.book_append_sheet(workbook, allSheet, 'Semua Anggota');

    // Sheet 2: Ringkasan Daftar Grup
    const summaryRows = groups.map((g, idx) => ({
      'No': idx + 1,
      'Nama Grup': g.name,
      'Total Peserta': g.memberCount,
      'JID Grup': g.jid,
      'Deskripsi / Topik': g.topic || '—'
    }));
    const summarySheet = xlsx.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 16 },
      { wch: 36 },
      { wch: 45 }
    ];
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Daftar Grup');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    logger.info({ sessionId, totalGroups: groups.length, totalMembers: allMembersRows.length }, 'Exported all groups to Excel');
    return { buffer, totalGroups: groups.length, totalMembers: allMembersRows.length };
  }

  public async importGroupMembersToContacts(sessionId: string, groupJid: string): Promise<{ count: number; groupName: string }> {
    let group: GroupInfo | null = null;
    let groupName = 'Grup WhatsApp';
    const db = getDatabase();

    try {
      group = await this.getGroupMetadata(sessionId, groupJid);
      groupName = group.name;
    } catch {
      // Fallback to local cache
      const cached = this.getCachedGroups(sessionId).find(g => g.jid === groupJid);
      if (cached) groupName = cached.name;
      const groupId = `${sessionId}_${groupJid}`;
      const savedMembers = db.prepare('SELECT jid, phone, role FROM group_members WHERE group_id = ?').all(groupId) as any[];
      if (savedMembers && savedMembers.length > 0) {
        group = {
          jid: groupJid,
          name: groupName,
          memberCount: savedMembers.length,
          participants: savedMembers.map(m => ({ jid: m.jid, phone: m.phone, role: m.role }))
        };
      }
    }

    if (!group || !group.participants || group.participants.length === 0) {
      throw new Error(`Data anggota grup "${groupName}" belum dapat diakses. Mohon refresh grup terlebih dahulu.`);
    }

    let count = 0;
    const tx = db.transaction(() => {
      for (const p of group!.participants) {
        let cleanPhone = p.phone ? p.phone.replace(/[^0-9]/g, '') : '';
        if (!cleanPhone && p.jid) {
          cleanPhone = p.jid.replace(/:[0-9]+@/, '@').split('@')[0].replace(/[^0-9]/g, '');
        }
        if (!cleanPhone || cleanPhone.length < 7) continue;

        // Skip anonymous LIDs where WhatsApp hides the member's phone number!
        const isAnonymousLid = cleanPhone.length >= 14 && (cleanPhone.startsWith('1') || cleanPhone.startsWith('2') || cleanPhone.startsWith('98'));
        if (isAnonymousLid) {
          const session = sessionManager.getSession(sessionId);
          const resolved = session ? (session as any).resolveLidToPhone?.(cleanPhone) : undefined;
          if (resolved) {
            cleanPhone = resolved;
          } else {
            // Cannot import member without real phone number to CRM contacts!
            continue;
          }
        }

        if (cleanPhone.startsWith('0')) {
          cleanPhone = '62' + cleanPhone.substring(1);
        } else if (cleanPhone.startsWith('8')) {
          cleanPhone = '62' + cleanPhone;
        }

        contactRepository.upsert({
          sessionId,
          jid: `${cleanPhone}@s.whatsapp.net`,
          phone: cleanPhone,
          name: p.name || `Member ${group!.name}`,
          tags: ['Grup', group!.name]
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
