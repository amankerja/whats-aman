import http from 'http';
import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import swaggerUi from 'swagger-ui-express';

import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { eventBus } from '../core/events/event-bus';
import { swaggerDocument } from './swagger';

// Routes
import { sessionRouter } from './routes/session.routes';
import { messageRouter } from './routes/message.routes';
import { contactRouter } from './routes/contact.routes';
import { groupRouter } from './routes/group.routes';
import { campaignRouter } from './routes/campaign.routes';
import { automationRouter } from './routes/automation.routes';
import { systemRouter } from './routes/system.routes';
import { crmRouter } from './routes/crm.routes';
import { templateRouter } from './routes/template.routes';
import { webhookRouter } from './routes/webhook.routes';
import { chatFlowRouter } from './routes/chatflow.routes';
import { integrationRouter } from './routes/integration.routes';

export function createServer(): { app: express.Application; server: http.Server } {
  const app = express();
  const server = http.createServer(app);

  // Middlewares
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static media storage
  app.use('/media', express.static(config.storage.mediaDir));

  // Swagger Documentation (Support both /docs and /api/docs as per PRD)
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Optional API Key Authentication Middleware (PRD Section 21)
  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    if (!config.server.apiKey) return next();
    // Allow public read on swagger or health
    if (req.path === '/health' || req.path === '/status') return next();

    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : apiKeyHeader;

    if (!token || token !== config.server.apiKey) {
      res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid or missing API key' });
      return;
    }
    next();
  });

  // Health and Status Endpoints (PRD Section 20 - Support both root and /api/v1 paths)
  app.get(['/health', '/api/v1/health'], (req: Request, res: Response) => {
    res.json({ success: true, status: 'ok', timestamp: Date.now() });
  });
  app.get(['/status', '/api/v1/status'], (req: Request, res: Response) => {
    res.redirect('/api/v1/system/status');
  });

  // API Routes
  app.use('/api/v1/sessions', sessionRouter);
  app.use('/api/v1/messages', messageRouter);
  app.use('/api/v1/contacts', contactRouter);
  app.use('/api/v1/groups', groupRouter);
  app.use('/api/v1/campaigns', campaignRouter);
  app.use('/api/v1/automation', automationRouter);
  app.use('/api/v1/system', systemRouter);
  app.use('/api/v1/crm', crmRouter);
  app.use('/api/v1/templates', templateRouter);
  app.use('/api/v1/webhooks', webhookRouter);
  app.use('/api/v1/chatflows', chatFlowRouter);
  app.use('/api/v1/integrations', integrationRouter);

  // Serve Frontend UI static files if built
  const uiDistPath = path.resolve(process.cwd(), 'ui', 'dist');
  if (fs.existsSync(uiDistPath)) {
    app.use(express.static(uiDistPath));
    app.use((req, res, next) => {
      if (
        req.method !== 'GET' ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/docs') ||
        req.path.startsWith('/media') ||
        req.path === '/health' ||
        req.path === '/status'
      ) {
        return next();
      }
      res.sendFile(path.join(uiDistPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({ err: err.message, stack: err.stack, path: req.path }, 'API Error occurred');

    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
        errors: (err as any).errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred'
    });
  });

  // WebSocket Server for Real-Time UI updates
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    logger.debug('New WebSocket client connected for real-time events');

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() }));
  });

  const broadcastEvent = (event: string, payload: any) => {
    const message = JSON.stringify({ event, payload, timestamp: Date.now() });
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  };

  // Wire EventBus to WebSocket broadcast
  eventBus.on('session.status', (data) => broadcastEvent('session.status', data));
  eventBus.on('session.qr', (data) => broadcastEvent('session.qr', data));
  eventBus.on('session.pairing_code', (data) => broadcastEvent('session.pairing_code', data));
  eventBus.on('session.connected', (data) => broadcastEvent('session.connected', data));
  eventBus.on('session.disconnected', (data) => broadcastEvent('session.disconnected', data));
  eventBus.on('message.received', (data) => broadcastEvent('message.received', data));
  eventBus.on('message.sent', (data) => broadcastEvent('message.sent', data));
  eventBus.on('message.ack', (data) => broadcastEvent('message.ack', data));
  eventBus.on('campaign.updated', (data) => broadcastEvent('campaign.updated', data));
  eventBus.on('automation.triggered', (data) => broadcastEvent('automation.triggered', data));

  return { app, server };
}
