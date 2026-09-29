import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { contactRepository, ContactRecord } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { sessionManager } from '../engine/session.manager';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class ContactService {
  public resolveAndCleanLidContacts(targetSessionId?: string): {
    resolvedCount: number;
    mergedDuplicates: number;
    updatedCount: number;
    messagesUpdated: number;
  } {
    const db = getDatabase();
    const sessionsDir = config.storage.sessionsDir;

    // 1. Collect all reverse mappings from disk
    const lidMap = new Map<string, string>();
    try {
      if (fs.existsSync(sessionsDir)) {
        const sessionDirs = fs.readdirSync(sessionsDir);
        for (const sDir of sessionDirs) {
          const authDir = path.join(sessionsDir, sDir, 'auth');
          if (fs.existsSync(authDir)) {
            const files = fs.readdirSync(authDir).filter(f => f.startsWith('lid-mapping-') && f.endsWith('_reverse.json'));
            for (const file of files) {
              const lid = file.replace('lid-mapping-', '').replace('_reverse.json', '');
              try {
                const raw = fs.readFileSync(path.join(authDir, file), 'utf-8');
                const phone = JSON.parse(raw);
                if (typeof phone === 'string' && /^\d{7,16}$/.test(phone)) {
                  lidMap.set(lid, phone);
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Error scanning sessions auth directory for LID mappings');
    }

    let resolvedCount = 0;
    let mergedDuplicates = 0;
    let updatedCount = 0;
    let messagesUpdated = 0;

    // 2. Process contacts table
    const contactSql = targetSessionId
      ? `SELECT * FROM contacts WHERE session_id = ?`
      : `SELECT * FROM contacts`;
    const contacts = targetSessionId
      ? (db.prepare(contactSql).all(targetSessionId) as ContactRecord[])
      : (db.prepare(contactSql).all() as ContactRecord[]);

    const deleteStmt = db.prepare(`DELETE FROM contacts WHERE id = ?`);
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

    const runInTransaction = db.transaction(() => {
      for (const c of contacts) {
        const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
        const cleanJid = (c.jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

        const isLid = lidMap.has(cleanPhone) || lidMap.has(cleanJid) || cleanPhone.length >= 14 || (cleanPhone.length >= 12 && cleanPhone.startsWith('10'));
        if (!isLid) continue;

        const realPhone = lidMap.get(cleanPhone) || lidMap.get(cleanJid);
        if (realPhone) {
          resolvedCount++;
          // Check if contact already exists with this realPhone in same session
          const existing = db.prepare(`
            SELECT * FROM contacts 
            WHERE session_id = ? AND (phone = ? OR jid = ?) AND id != ?
          `).get(c.session_id, realPhone, `${realPhone}@s.whatsapp.net`, c.id) as any;

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
              const msg = findNameInMessagesStmt.get(c.session_id, `%${cleanPhone}%`, `%${cleanPhone}%`) as any;
              if (msg && msg.push_name) {
                recoveredName = msg.push_name;
                recoveredPushName = msg.push_name;
              }
            }
            const newCanonicalJid = `${realPhone}@s.whatsapp.net`;
            const newId = `${c.session_id}:${newCanonicalJid}`;
            updateStmt.run(newId, newCanonicalJid, realPhone, recoveredName || null, recoveredPushName || null, Date.now(), c.id);
            updatedCount++;
          }
        } else {
          // Unresolvable anonymous LID without phone number (e.g. Community member with phone privacy):
          // Remove from CRM contacts table so it doesn't clutter the user's contact book with unusable records
          deleteStmt.run(c.id);
          mergedDuplicates++;
        }
      }

      // 3. Migrate messages table chat_jid and sender_jid that end with @lid
      const msgChatUpdateStmt = db.prepare(`UPDATE messages SET chat_jid = ? WHERE id = ?`);
      const msgSenderUpdateStmt = db.prepare(`UPDATE messages SET sender_jid = ? WHERE id = ?`);

      const msgsWithLid = (targetSessionId
        ? db.prepare(`SELECT id, session_id, chat_jid, sender_jid FROM messages WHERE session_id = ? AND (chat_jid LIKE '%@lid' OR sender_jid LIKE '%@lid')`).all(targetSessionId)
        : db.prepare(`SELECT id, session_id, chat_jid, sender_jid FROM messages WHERE chat_jid LIKE '%@lid' OR sender_jid LIKE '%@lid'`).all()) as any[];

      for (const m of msgsWithLid) {
        let updated = false;
        if (m.chat_jid && m.chat_jid.endsWith('@lid')) {
          const cleanLid = m.chat_jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
          const realPhone = lidMap.get(cleanLid);
          if (realPhone) {
            msgChatUpdateStmt.run(`${realPhone}@s.whatsapp.net`, m.id);
            updated = true;
          }
        }
        if (m.sender_jid && m.sender_jid.endsWith('@lid')) {
          const cleanLid = m.sender_jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
          const realPhone = lidMap.get(cleanLid);
          if (realPhone) {
            msgSenderUpdateStmt.run(`${realPhone}@s.whatsapp.net`, m.id);
            updated = true;
          }
        }
        if (updated) {
          messagesUpdated++;
        }
      }
    });

    runInTransaction();

    logger.info({
      targetSessionId,
      resolvedCount,
      mergedDuplicates,
      updatedCount,
      messagesUpdated
    }, 'Completed LID contacts and messages migration');

    return { resolvedCount, mergedDuplicates, updatedCount, messagesUpdated };
  }

  public syncContactsFromMessagesAndGroups(sessionId: string): number {
    // Run LID clean & migration first
    this.resolveAndCleanLidContacts(sessionId);

    const db = getDatabase();
    const msgs = db.prepare(`
      SELECT chat_jid, push_name 
      FROM messages 
      WHERE session_id = ? 
        AND from_me = 0 
        AND chat_jid NOT LIKE '%@g.us' 
        AND chat_jid NOT LIKE '%@broadcast' 
        AND chat_jid NOT LIKE '%@newsletter'
        AND push_name IS NOT NULL
        AND TRIM(push_name) != ''
      ORDER BY timestamp DESC
    `).all(sessionId) as Array<{ chat_jid: string; push_name?: string }>;

    const session = sessionManager.getSession(sessionId);
    let count = 0;
    const seen = new Set<string>();

    for (const m of msgs) {
      if (seen.has(m.chat_jid)) continue;
      seen.add(m.chat_jid);

      let phone: string | undefined = undefined;
      const cleanId = m.chat_jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

      // Check if cleanId is an LID
      const resolvedLid = session ? (session as any).resolveLidToPhone?.(cleanId) : undefined;
      if (resolvedLid) {
        phone = resolvedLid;
      } else if (m.chat_jid.endsWith('@s.whatsapp.net') || m.chat_jid.endsWith('@c.us')) {
        phone = cleanId;
      } else if (m.chat_jid.endsWith('@lid') && session) {
        phone = (session as any).resolveLidToPhone?.(m.chat_jid);
      }

      if (phone && /^\d{7,16}$/.test(phone)) {
        const trimmedPush = (m.push_name || '').trim();
        if (!trimmedPush || trimmedPush === '-' || trimmedPush === '—') {
          continue;
        }
        contactRepository.upsert({
          sessionId,
          jid: `${phone}@s.whatsapp.net`,
          phone,
          name: trimmedPush,
          pushName: trimmedPush
        });
        count++;
      }
    }

    logger.info({ sessionId, count }, 'Synchronized contacts from messages and session');
    return count;
  }

  public cleanUnnamedContacts(sessionId: string): { count: number } {
    const count = contactRepository.cleanUnnamed(sessionId);
    logger.info({ sessionId, count }, 'Cleaned unnamed contacts');
    return { count };
  }

  public addOrUpdateContact(data: {
    sessionId: string;
    phone: string;
    name?: string;
    pushName?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    pipelineStage?: 'lead' | 'prospect' | 'customer' | 'churned';
    dealValue?: number;
    notes?: string;
    optOut?: boolean;
  }): void {
    let cleanPhone = data.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }
    const jid = `${cleanPhone}@s.whatsapp.net`;

    contactRepository.upsert({
      sessionId: data.sessionId,
      jid,
      phone: cleanPhone,
      name: data.name,
      pushName: data.pushName,
      tags: data.tags,
      customFields: data.customFields,
      pipelineStage: data.pipelineStage,
      dealValue: data.dealValue,
      notes: data.notes,
      optOut: data.optOut
    });
  }

  public getContacts(sessionId: string, limit = 10000, offset = 0): { data: ContactRecord[]; total: number } {
    const data = contactRepository.findAll(sessionId, limit, offset);
    const total = contactRepository.count(sessionId);
    return { data, total };
  }

  public setOptOut(sessionId: string, phone: string, optOut: boolean): void {
    this.addOrUpdateContact({
      sessionId,
      phone,
      optOut
    });
  }

  public deleteContact(sessionId: string, phone: string): void {
    contactRepository.delete(sessionId, phone);
  }

  public batchDeleteContacts(sessionId: string, phones: string[]): number {
    return contactRepository.batchDelete(sessionId, phones);
  }

  public batchUpdateStage(sessionId: string, phones: string[], stage: 'lead' | 'prospect' | 'customer' | 'churned' | 'none'): number {
    return contactRepository.batchUpdateStage(sessionId, phones, stage);
  }

  public batchToggleOptOut(sessionId: string, phones: string[], optOut: boolean): number {
    return contactRepository.batchToggleOptOut(sessionId, phones, optOut);
  }

  public batchUpdateTags(sessionId: string, phones: string[], tags: string[], mode: 'add' | 'remove' | 'replace'): number {
    return contactRepository.batchUpdateTags(sessionId, phones, tags, mode);
  }

  public getTags(sessionId: string): Array<{ tag: string; count: number }> {
    return contactRepository.getAllTags(sessionId);
  }

  public getContactsByTag(sessionId: string, tag: string): ContactRecord[] {
    return contactRepository.findByTag(sessionId, tag);
  }

  public getContactsByStage(sessionId: string, stage: string): ContactRecord[] {
    return contactRepository.findByStage(sessionId, stage);
  }

  public updateContactTags(sessionId: string, phone: string, tags: string[]): void {
    contactRepository.updateTags(sessionId, phone, tags);
  }

  public updatePipelineStage(sessionId: string, phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned' | 'none'): void {
    contactRepository.updateStage(sessionId, phone, stage);
  }

  public updateDealValue(sessionId: string, phone: string, dealValue: number): void {
    contactRepository.updateDealValue(sessionId, phone, dealValue);
  }

  public updateNotes(sessionId: string, phone: string, notes: string): void {
    contactRepository.updateNotes(sessionId, phone, notes);
  }

  public importFromBuffer(sessionId: string, buffer: Buffer, filename: string): number {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    let count = 0;
    for (const row of rows) {
      // Look for phone field under various aliases in Indonesian and English
      const rawPhone = 
        row['Nomor Telepon'] || row['No HP'] || row['No WA'] || row['Telepon'] || row['Handphone'] ||
        row.phone || row.no_hp || row.nomor || row.telp || row.mobile || row.Phone || row.WhatsApp;
      if (!rawPhone) continue;

      let phone = String(rawPhone).replace(/[^0-9]/g, '');
      if (phone.length < 7) continue;

      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      } else if (phone.startsWith('8')) {
        phone = '62' + phone;
      }

      const name = 
        row['Nama Kontak'] || row['Nama Lengkap'] || row['Nama Pelanggan'] || row['Pelanggan'] ||
        row.name || row.nama || row.Nama || row.Name || '';

      const rawTags = 
        row['Group / Tags'] || row['Group'] || row['Grup'] || row['Kategori'] ||
        row.tag || row.tags || row.Tag || row.Tags || '';
      const tags = rawTags ? String(rawTags).split(',').map((t) => t.trim()).filter(Boolean) : [];

      const rawStage = (
        row['Pipeline Stage'] || row['Status Pipeline'] || row['Status CRM'] ||
        row.stage || row.pipeline || 'lead'
      ).toString().toLowerCase().trim();
      const validStage = ['lead', 'prospect', 'customer', 'churned'].includes(rawStage) ? (rawStage as any) : 'lead';

      const notes = 
        row['Catatan CRM'] || row['Catatan'] || row['Keterangan'] ||
        row.notes || row.catatan || row.Notes || row.Catatan || '';

      this.addOrUpdateContact({
        sessionId,
        phone,
        name,
        tags,
        pipelineStage: validStage,
        notes,
        customFields: row
      });
      count++;
    }

    logger.info({ sessionId, count, filename }, 'Imported contacts from file');
    return count;
  }

  public exportToExcel(sessionId: string): Buffer {
    const { data } = this.getContacts(sessionId, 10000, 0);
    const exportRows = data.map((c, idx) => ({
      No: idx + 1,
      'Nomor Telepon': c.phone,
      'Nama Kontak': c.name || '',
      'Push Name (WA)': c.push_name || '',
      'Pipeline Stage': (c.pipeline_stage || 'lead').toUpperCase(),
      'Deal Value (Rp)': c.deal_value || 0,
      'Group / Tags': c.tags.join(', '),
      'Status Opt-Out': c.opt_out ? 'OPT-OUT (BLOKIR)' : 'OPT-IN AKTIF',
      'Catatan CRM': c.notes || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Direktori Kontak');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  public generateTemplateExcel(): Buffer {
    const sampleRows = [
      {
        'Nomor Telepon': '081234567890',
        'Nama Kontak': 'Budi Santoso',
        'Pipeline Stage': 'lead',
        'Group / Tags': 'VIP, Pelanggan Baru',
        'Catatan CRM': 'Minat promo paket bundling awal bulan'
      },
      {
        'Nomor Telepon': '6289876543210',
        'Nama Kontak': 'Siti Rahmawati',
        'Pipeline Stage': 'prospect',
        'Group / Tags': 'Reseller, Jawa Barat',
        'Catatan CRM': 'Menunggu konfirmasi sampel produk'
      },
      {
        'Nomor Telepon': '085712345678',
        'Nama Kontak': 'Ahmad Fauzi',
        'Pipeline Stage': 'customer',
        'Group / Tags': 'Prioritas, Grosir',
        'Catatan CRM': 'Repeat order rutin setiap minggu'
      }
    ];

    const worksheet = xlsx.utils.json_to_sheet(sampleRows);
    
    // Set nice column widths
    worksheet['!cols'] = [
      { wch: 18 }, // Nomor Telepon
      { wch: 22 }, // Nama Kontak
      { wch: 16 }, // Pipeline Stage
      { wch: 25 }, // Group / Tags
      { wch: 40 }  // Catatan CRM
    ];

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Template Kontak');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const contactService = new ContactService();
