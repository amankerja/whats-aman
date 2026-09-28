import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { contactService } from '../../core/services/contact.service';
import { AuditService } from '../../core/services/audit.service';

const upload = multer({ storage: multer.memoryStorage() });
export const contactRouter = Router();

// POST /api/v1/contacts/sync - Synchronize contacts from session chats, groups, and LID mappings
contactRouter.post('/sync', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const count = contactService.syncContactsFromMessagesAndGroups(String(sessionId));
    res.json({ success: true, message: `Berhasil sinkronisasi ${count} kontak`, count });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/contacts - List contacts
contactRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, limit, offset } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const result = contactService.getContacts(
      String(sessionId),
      limit ? parseInt(String(limit), 10) : 100,
      offset ? parseInt(String(offset), 10) : 0
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/contacts/tags - List all tags/groups with contact counts
contactRouter.get('/tags', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const tags = contactService.getTags(String(sessionId));
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/contacts/by-tag - Get contacts filtered by group/tag
contactRouter.get('/by-tag', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, tag } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const contacts = contactService.getContactsByTag(String(sessionId), String(tag || ''));
    res.json({ success: true, data: contacts, total: contacts.length });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/contacts/:phone/tags - Update tags for a contact
contactRouter.put('/:phone/tags', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.body.sessionId || req.query.sessionId) as string;
    const { tags } = req.body;
    const phone = req.params.phone;
    if (!sessionId || !Array.isArray(tags)) {
      res.status(400).json({ success: false, message: 'sessionId and tags array are required' });
      return;
    }
    contactService.updateContactTags(String(sessionId), String(phone), tags);
    res.json({ success: true, message: 'Tags updated successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/contacts - Add or update contact
contactRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, phone, name, tags, customFields, optOut } = req.body;
    if (!sessionId || !phone) {
      res.status(400).json({ success: false, message: 'sessionId and phone are required' });
      return;
    }
    contactService.addOrUpdateContact({
      sessionId,
      phone,
      name,
      tags,
      customFields,
      optOut: Boolean(optOut)
    });
    res.json({ success: true, message: 'Contact saved' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/contacts/opt-out - Toggle opt-out
contactRouter.post('/opt-out', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, phone, optOut } = req.body;
    contactService.setOptOut(sessionId, phone, Boolean(optOut));
    res.json({ success: true, message: `Contact opt-out set to ${Boolean(optOut)}` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/contacts/:phone/opt-out - Toggle opt-out by phone param
contactRouter.patch('/:phone/opt-out', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.query.sessionId || req.body.sessionId) as string;
    const phone = req.params.phone;
    const optOut = req.body.optOut;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    contactService.setOptOut(String(sessionId), String(phone), Boolean(optOut));
    res.json({ success: true, message: `Contact opt-out set to ${Boolean(optOut)}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/contacts/:phone - Delete contact
contactRouter.delete('/:phone', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    const phone = req.params.phone;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    contactService.deleteContact(String(sessionId), String(phone));
    AuditService.log('user', 'delete', 'contact', { sessionId, phone });
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/contacts/import or /import-excel - Import contacts from Excel / CSV
const handleImport = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !req.file) {
      res.status(400).json({ success: false, message: 'sessionId and Excel/CSV file are required' });
      return;
    }
    const count = contactService.importFromBuffer(sessionId, req.file.buffer, req.file.originalname);
    AuditService.log('user', 'import', 'contact', { sessionId, file: req.file.originalname, count });
    res.json({ success: true, message: `Successfully imported ${count} contacts`, count });
  } catch (err) {
    next(err);
  }
};
contactRouter.post('/import', upload.single('file'), handleImport);
contactRouter.post('/import-excel', upload.single('file'), handleImport);

// GET /api/v1/contacts/by-stage - Get contacts filtered by pipeline stage
contactRouter.get('/by-stage', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, stage } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const contacts = contactService.getContactsByStage(String(sessionId), String(stage || ''));
    res.json({ success: true, data: contacts, total: contacts.length });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/contacts/:phone/stage - Update pipeline stage for a contact
contactRouter.put('/:phone/stage', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.body.sessionId || req.query.sessionId) as string;
    const { stage } = req.body;
    const phone = req.params.phone;
    if (!sessionId || !stage) {
      res.status(400).json({ success: false, message: 'sessionId and stage are required' });
      return;
    }
    contactService.updatePipelineStage(String(sessionId), String(phone), stage);
    res.json({ success: true, message: `Pipeline stage updated to ${stage}` });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/contacts/:phone/notes - Update notes for a contact
contactRouter.put('/:phone/notes', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = (req.body.sessionId || req.query.sessionId) as string;
    const { notes } = req.body;
    const phone = req.params.phone;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    contactService.updateNotes(String(sessionId), String(phone), String(notes || ''));
    res.json({ success: true, message: 'Contact notes updated successfully' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/contacts/export - Export contacts to Excel file
contactRouter.get('/export', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const buffer = contactService.exportToExcel(String(sessionId));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="contacts_${sessionId}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
