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

// POST /api/v1/sessions/:id/logout - Log out from WhatsApp
sessionRouter.post('/:id/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await sessionManager.logoutSession(id);
    res.json({ success: true, message: 'Session logged out' });
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

// GET /api/v1/sessions/:id/avatar - Direct image stream or redirect
sessionRouter.get('/:id/avatar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const jid = req.query.jid ? String(req.query.jid) : undefined;
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const url = await sessionManager.getProfilePictureUrl(sessionId, jid, forceRefresh);

    if (!url) {
      res.status(404).json({ success: false, message: 'Avatar not found' });
      return;
    }

    try {
      const imgRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
        return;
      }
    } catch {
      // fallback to redirect
    }

    res.redirect(url);
  } catch (err) {
    res.status(404).json({ success: false, message: 'Avatar not found' });
  }
});

// GET /api/v1/sessions/:id/profile-picture - Get avatar URL JSON
sessionRouter.get('/:id/profile-picture', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const jid = req.query.jid ? String(req.query.jid) : undefined;
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const url = await sessionManager.getProfilePictureUrl(sessionId, jid, forceRefresh);
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sessions/:id/profile-picture/batch - Get avatar URLs in batch
sessionRouter.post('/:id/profile-picture/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const { jids } = req.body;
    if (!Array.isArray(jids)) {
      res.status(400).json({ success: false, message: 'jids array required' });
      return;
    }

    const session = sessionManager.getSession(sessionId);
    const result: Record<string, string | null> = {};

    await Promise.all(
      jids.map(async (j: string) => {
        if (typeof j === 'string') {
          try {
            result[j] = session.getProfilePictureUrl ? await session.getProfilePictureUrl(j) : null;
          } catch {
            result[j] = null;
          }
        }
      })
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
