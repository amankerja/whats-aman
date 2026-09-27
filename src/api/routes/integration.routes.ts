import { Router, Request, Response, NextFunction } from 'express';
import { integrationRepository, IntegrationProvider } from '../../core/database/repositories/integration.repository';
import { integrationService } from '../../core/services/integration.service';

export const integrationRouter = Router();

// ========================================================
// 1. PUBLIC WEBHOOK INGESTION ENDPOINTS (Fitur #20 - #25)
// ========================================================

// POST /api/v1/integrations/webhook/:provider/:sessionId
integrationRouter.post('/webhook/:provider/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = String(req.params.provider);
    const sessionId = String(req.params.sessionId);
    const secretToken =
      (req.headers['x-integration-token'] as string) ||
      (req.headers['x-secret-token'] as string) ||
      (req.query.token as string) ||
      (req.body.token as string) ||
      undefined;

    const result = await integrationService.processIncomingWebhook(
      provider,
      sessionId,
      req.body,
      secretToken
    );

    res.json({
      success: true,
      message: `Webhook successfully ingested and WhatsApp notification sent to ${result.targetPhone}`,
      data: result
    });
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: err.message });
      return;
    }
    next(err);
  }
});

// POST /api/v1/integrations/webhook/:provider (Fallback when sessionId is in query/body)
integrationRouter.post('/webhook/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provider = String(req.params.provider);
    const sessionId =
      (req.query.sessionId as string) ||
      (req.body.sessionId as string) ||
      (req.body.session_id as string) ||
      'default';

    const secretToken =
      (req.headers['x-integration-token'] as string) ||
      (req.headers['x-secret-token'] as string) ||
      (req.query.token as string) ||
      (req.body.token as string) ||
      undefined;

    const result = await integrationService.processIncomingWebhook(
      provider,
      sessionId,
      req.body,
      secretToken
    );

    res.json({
      success: true,
      message: `Webhook successfully ingested and WhatsApp notification sent to ${result.targetPhone}`,
      data: result
    });
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: err.message });
      return;
    }
    next(err);
  }
});

// ========================================================
// 2. CONFIGURATION MANAGEMENT ENDPOINTS
// ========================================================

// GET /api/v1/integrations/configs - List all configs
integrationRouter.get('/configs', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const configs = integrationRepository.findAllConfigs(sessionId);
  res.json({ success: true, data: configs });
});

// POST /api/v1/integrations/configs - Create or update config
integrationRouter.post('/configs', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, sessionId, provider, name, secretToken, templateText, adminPhone, adminTemplateText, isActive } =
      req.body;

    if (!provider || !name || !templateText) {
      res.status(400).json({
        success: false,
        message: 'provider, name, and templateText are required'
      });
      return;
    }

    const saved = integrationRepository.upsertConfig({
      id,
      sessionId,
      provider: provider as IntegrationProvider,
      name,
      secretToken,
      templateText,
      adminPhone,
      adminTemplateText,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({
      success: true,
      message: 'Integration config saved successfully',
      data: saved
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/integrations/configs/:id - Get config by ID
integrationRouter.get('/configs/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const config = integrationRepository.findConfigById(id);

  if (!config) {
    res.status(404).json({ success: false, message: 'Integration config not found' });
    return;
  }

  res.json({ success: true, data: config });
});

// DELETE /api/v1/integrations/configs/:id - Delete config
integrationRouter.delete('/configs/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = integrationRepository.deleteConfig(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Integration config not found' });
    return;
  }

  res.json({ success: true, message: 'Integration config deleted successfully' });
});

// GET /api/v1/integrations/logs - Query ingestion history
integrationRouter.get('/logs', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const provider = req.query.provider as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const logs = integrationRepository.findLogs({ sessionId, provider, limit });
  res.json({ success: true, total: logs.length, data: logs });
});
