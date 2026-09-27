import { Router, Request, Response, NextFunction } from 'express';
import { webhookRepository } from '../../core/database/repositories/webhook.repository';
import { webhookService } from '../../core/services/webhook.service';

export const webhookRouter = Router();

// GET /api/v1/webhooks - List all registered webhooks
webhookRouter.get('/', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const webhooks = webhookRepository.findAll(sessionId);
  res.json({ success: true, data: webhooks });
});

// POST /api/v1/webhooks - Register a new webhook
webhookRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, targetUrl, events, sessionId, secretKey, isActive } = req.body;

    if (!name || !targetUrl) {
      res.status(400).json({ success: false, message: 'Field name and targetUrl are required' });
      return;
    }

    try {
      new URL(targetUrl);
    } catch {
      res.status(400).json({ success: false, message: 'Invalid targetUrl format. Must be a valid HTTP/HTTPS URL.' });
      return;
    }

    const created = webhookRepository.create({
      name,
      targetUrl,
      events: Array.isArray(events) ? events : undefined,
      sessionId: sessionId || undefined,
      secretKey: secretKey || undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/webhooks/:id - Get webhook by ID
webhookRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const webhook = webhookRepository.findById(id);

  if (!webhook) {
    res.status(404).json({ success: false, message: 'Webhook not found' });
    return;
  }

  res.json({ success: true, data: webhook });
});

// PUT /api/v1/webhooks/:id - Update webhook by ID
webhookRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, targetUrl, events, sessionId, secretKey, isActive } = req.body;

    if (targetUrl) {
      try {
        new URL(targetUrl);
      } catch {
        res.status(400).json({ success: false, message: 'Invalid targetUrl format' });
        return;
      }
    }

    const updated = webhookRepository.update(id, {
      name,
      targetUrl,
      events: Array.isArray(events) ? events : undefined,
      sessionId,
      secretKey,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/webhooks/:id - Delete webhook by ID
webhookRouter.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = webhookRepository.delete(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Webhook not found' });
    return;
  }

  res.json({ success: true, message: 'Webhook deleted successfully' });
});

// POST /api/v1/webhooks/:id/test - Send test ping to verify destination URL
webhookRouter.post('/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const result = await webhookService.sendTestPing(id);

    res.json({
      success: result.success,
      message: result.success
        ? `Test ping successful (HTTP ${result.statusCode}, ${result.responseTimeMs}ms)`
        : `Test ping failed: ${result.error}`,
      data: result
    });
  } catch (err: any) {
    if (err.message === 'Webhook not found') {
      res.status(404).json({ success: false, message: 'Webhook not found' });
      return;
    }
    next(err);
  }
});
