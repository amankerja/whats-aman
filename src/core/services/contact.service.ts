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

  public batchDeleteContacts(sessionId: string, phones: string[]): number {
    return contactRepository.batchDelete(sessionId, phones);
  }

  public batchUpdateStage(sessionId: string, phones: string[], stage: 'lead' | 'prospect' | 'customer' | 'churned'): number {
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
