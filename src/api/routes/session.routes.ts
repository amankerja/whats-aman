import { Router, Request, Response, NextFunction } from 'express';
import { sessionManager } from '../../core/engine/session.manager';
import { sessionRepository } from '../../core/database/repositories/session.repository';

export const sessionRouter = Router();

// GET /api/v1/sessions - List all sessions
sessionRouter.get('/', (req: Request, res: Response) => {
  const sessions = sessionManager.getAllSessions();
  res.json({ success: true, data: sessions });
});

// POST /api/v1/sessions - Create session
sessionRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name } = req.body;
    if (!id) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }
    const session = await sessionManager.createSession(id, name);
    sessionRepository.upsert({ id, name: name || id, status: 'DISCONNECTED' });
    res.status(201).json({ success: true, data: session.getMetadata() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sessions/:id - Get session details
sessionRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const session = sessionManager.getSession(id);
    res.json({ success: true, data: session.getMetadata() });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sessions/:id/connect - Start connection (QR or Pairing Code)
sessionRouter.post('/:id/connect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { usePairingCode, phoneNumber } = req.body;
    await sessionManager.startSession(id, {
      usePairingCode: Boolean(usePairingCode),
      phoneNumber
    });
    const session = sessionManager.getSession(id);
    res.json({ success: true, message: 'Connection initiated', data: session.getMetadata() });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sessions/:id/disconnect - Stop connection
sessionRouter.post('/:id/disconnect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await sessionManager.stopSession(id);
    res.json({ success: true, message: 'Session disconnected' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/sessions/:id - Delete session completely
sessionRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await sessionManager.deleteSession(id);
    sessionRepository.delete(id);
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    next(err);
  }
});
