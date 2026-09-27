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
    const { sessionId, to, text, quotedMessageId, mentions, interpolateVariables } = req.body;
    const sent = await messageService.sendText({
      sessionId,
      to,
      text,
      quotedMessageId,
      mentions,
      interpolateVariables: Boolean(interpolateVariables)
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

// POST /api/v1/messages/location - Send location message
messageRouter.post('/location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, to, latitude, longitude, name, address } = req.body;
    if (!sessionId || !to || latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: 'sessionId, to, latitude, and longitude are required' });
      return;
    }

    const sent = await messageService.sendLocation({
      sessionId,
      to,
      latitude: Number(latitude),
      longitude: Number(longitude),
      name,
      address
    });

    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/messages/contact - Send vCard contact card (Sprint 5)
messageRouter.post('/contact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, to, contact, name, phone, organization, quotedMessageId } = req.body;
    if (!sessionId || !to) {
      res.status(400).json({ success: false, message: 'sessionId and to are required' });
      return;
    }

    const contactData = contact || { name, phone, organization };
    if (!contactData.name || !contactData.phone) {
      res.status(400).json({ success: false, message: 'contact.name and contact.phone are required' });
      return;
    }

    const sent = await messageService.sendContact({
      sessionId,
      to,
      contact: contactData,
      quotedMessageId
    });

    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/messages/poll - Send interactive WhatsApp poll (Sprint 5)
messageRouter.post('/poll', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, to, poll, name, values, selectableCount, quotedMessageId } = req.body;
    if (!sessionId || !to) {
      res.status(400).json({ success: false, message: 'sessionId and to are required' });
      return;
    }

    const pollData = poll || { name, values, selectableCount };
    if (!pollData.name || !pollData.values || pollData.values.length < 2) {
      res.status(400).json({ success: false, message: 'poll.name and at least 2 poll.values are required' });
      return;
    }

    const sent = await messageService.sendPoll({
      sessionId,
      to,
      poll: pollData,
      quotedMessageId
    });

    res.json({ success: true, data: sent });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/messages/send - Unified send endpoint (text, media, location)
messageRouter.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      to,
      message,
      text,
      mediaUrl,
      mediaPath,
      type,
      latitude,
      longitude,
      name,
      address,
      fileName,
      mimeType,
      quotedMessageId,
      mentions,
      interpolateVariables
    } = req.body;

    if (!sessionId || !to) {
      res.status(400).json({ success: false, message: 'sessionId and to are required' });
      return;
    }

    let sent: any;
    const textContent = message || text;

    if (latitude !== undefined && longitude !== undefined) {
      sent = await messageService.sendLocation({
        sessionId,
        to,
        latitude: Number(latitude),
        longitude: Number(longitude),
        name,
        address
      });
    } else if (type === 'contact' || req.body.contact) {
      const contactData = req.body.contact || { name, phone: req.body.phone, organization: req.body.organization };
      sent = await messageService.sendContact({
        sessionId,
        to,
        contact: contactData,
        quotedMessageId
      });
    } else if (type === 'poll' || req.body.poll) {
      const pollData = req.body.poll || { name: req.body.pollName || name, values: req.body.values, selectableCount: req.body.selectableCount };
      sent = await messageService.sendPoll({
        sessionId,
        to,
        poll: pollData,
        quotedMessageId
      });
    } else if (mediaUrl || mediaPath) {
      sent = await messageService.sendMedia({
        sessionId,
        to,
        mediaPathOrBuffer: mediaUrl || mediaPath,
        type: type || 'image',
        caption: textContent,
        fileName,
        mimeType,
        quotedMessageId
      });
    } else if (textContent) {
      sent = await messageService.sendText({
        sessionId,
        to,
        text: textContent,
        quotedMessageId,
        mentions,
        interpolateVariables: Boolean(interpolateVariables)
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payload must contain message/text, mediaUrl/mediaPath, location, contact, or poll'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        messageId: sent.id,
        to: sent.chatJid,
        status: sent.status,
        timestamp: sent.timestamp,
        mediaType: sent.mediaType || 'text',
        details: sent
      }
    });
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
      limit ? parseInt(String(limit), 10) : 1000
    );
    res.json({ success: true, data: chats });
  } catch (err) {
    next(err);
  }
});
