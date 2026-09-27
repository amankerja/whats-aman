import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { messageService } from '../../core/services/message.service';
import { config } from '../../config';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.mediaDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

export const messageRouter = Router();

// POST /api/v1/messages/text - Send text message
messageRouter.post('/text', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, to, text, quotedMessageId, mentions } = req.body;
    const sent = await messageService.sendText({
      sessionId,
      to,
      text,
      quotedMessageId,
      mentions
    });
    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/messages/media - Send media message (with file upload or path)
messageRouter.post('/media', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, to, type, caption, fileName, mimeType, quotedMessageId } = req.body;
    const filePath = req.file ? req.file.path : req.body.filePath;

    if (!filePath) {
      res.status(400).json({ success: false, message: 'Media file or filePath is required' });
      return;
    }

    const sent = await messageService.sendMedia({
      sessionId,
      to,
      mediaPathOrBuffer: filePath,
      type: type || 'document',
      caption,
      fileName: fileName || (req.file ? req.file.originalname : undefined),
      mimeType: mimeType || (req.file ? req.file.mimetype : undefined),
      quotedMessageId
    });

    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/messages/history - Get messages for chat
messageRouter.get('/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, chatJid, limit, offset } = req.query;
    if (!sessionId || !chatJid) {
      res.status(400).json({ success: false, message: 'sessionId and chatJid are required' });
      return;
    }
    const messages = messageService.getChatHistory(
      String(sessionId),
      String(chatJid),
      limit ? parseInt(String(limit), 10) : 50,
      offset ? parseInt(String(offset), 10) : 0
    );
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/messages/chats - Get active chats
messageRouter.get('/chats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, limit } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const chats = messageService.getRecentChats(
      String(sessionId),
      limit ? parseInt(String(limit), 10) : 50
    );
    res.json({ success: true, data: chats });
  } catch (err) {
    next(err);
  }
});
