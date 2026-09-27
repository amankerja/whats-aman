import xlsx from 'xlsx';
import { contactRepository, ContactRecord } from '../database/repositories/contact.repository';
import { logger } from '../../utils/logger';

export class ContactService {
  public addOrUpdateContact(data: {
    sessionId: string;
    phone: string;
    name?: string;
    pushName?: string;
    tags?: string[];
    customFields?: Record<string, any>;
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

      this.addOrUpdateContact({
        sessionId,
        phone,
        name,
        tags,
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
      Tags: c.tags.join(', '),
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
