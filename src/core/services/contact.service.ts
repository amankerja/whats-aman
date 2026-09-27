import xlsx from 'xlsx';
import { contactRepository, ContactRecord } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { sessionManager } from '../engine/session.manager';
import { logger } from '../../utils/logger';

export class ContactService {
  public syncContactsFromMessagesAndGroups(sessionId: string): number {
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
      if (m.chat_jid.endsWith('@s.whatsapp.net') || m.chat_jid.endsWith('@c.us')) {
        phone = m.chat_jid.split('@')[0];
      } else if (m.chat_jid.endsWith('@lid') && session) {
        phone = session.resolveLidToPhone?.(m.chat_jid);
      }

      if (phone && /^\d{7,16}$/.test(phone)) {
        contactRepository.upsert({
          sessionId,
          jid: `${phone}@s.whatsapp.net`,
          phone,
          name: m.push_name,
          pushName: m.push_name
        });
        count++;
      }
    }

    logger.info({ sessionId, count }, 'Synchronized contacts from messages and session');
    return count;
  }

  public addOrUpdateContact(data: {
    sessionId: string;
    phone: string;
    name?: string;
    pushName?: string;
    tags?: string[];
    customFields?: Record<string, any>;
    pipelineStage?: 'lead' | 'prospect' | 'customer' | 'churned';
    notes?: string;
    optOut?: boolean;
  }): void {
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
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
      notes: data.notes,
      optOut: data.optOut
    });
  }

  public getContacts(sessionId: string, limit = 100, offset = 0): { data: ContactRecord[]; total: number } {
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

  public updatePipelineStage(sessionId: string, phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned'): void {
    contactRepository.updateStage(sessionId, phone, stage);
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
      // Look for phone field under common names: phone, no_hp, nomor, telp, mobile
      const rawPhone = row.phone || row.no_hp || row.nomor || row.telp || row.mobile || row.Phone || row.WhatsApp;
      if (!rawPhone) continue;

      const phone = String(rawPhone).replace(/[^0-9]/g, '');
      if (phone.length < 7) continue;

      const name = row.name || row.nama || row.Nama || row.Name || '';
      const tags = row.tag || row.tags ? String(row.tag || row.tags).split(',').map((t) => t.trim()) : [];
      const stage = (row.stage || row.pipeline || 'lead').toLowerCase();
      const validStage = ['lead', 'prospect', 'customer', 'churned'].includes(stage) ? (stage as any) : 'lead';

      this.addOrUpdateContact({
        sessionId,
        phone,
        name,
        tags,
        pipelineStage: validStage,
        notes: row.notes || row.catatan || '',
        customFields: row
      });
      count++;
    }

    logger.info({ sessionId, count, filename }, 'Imported contacts from file');
    return count;
  }

  public exportToExcel(sessionId: string): Buffer {
    const { data } = this.getContacts(sessionId, 10000, 0);
    const exportRows = data.map((c) => ({
      Phone: c.phone,
      Name: c.name || '',
      PushName: c.push_name || '',
      PipelineStage: (c.pipeline_stage || 'lead').toUpperCase(),
      Tags: c.tags.join(', '),
      Notes: c.notes || '',
      OptOut: c.opt_out ? 'YES' : 'NO',
      ...c.custom_fields
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const contactService = new ContactService();
