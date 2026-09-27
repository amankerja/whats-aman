import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { contactService } from '../../core/services/contact.service';

const upload = multer({ storage: multer.memoryStorage() });
export const contactRouter = Router();

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
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/contacts/import - Import contacts from Excel / CSV
contactRouter.post('/import', upload.single('file'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !req.file) {
      res.status(400).json({ success: false, message: 'sessionId and Excel/CSV file are required' });
      return;
    }
    const count = contactService.importFromBuffer(sessionId, req.file.buffer, req.file.originalname);
    res.json({ success: true, message: `Successfully imported ${count} contacts`, count });
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
