import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabaseSchema } from './core/database/schema';
import { sessionManager } from './core/engine/session.manager';
import { messageService } from './core/services/message.service';
import { automationService } from './core/services/automation.service';
import { campaignService } from './core/services/campaign.service';
import { webhookService } from './core/services/webhook.service';
import { chatFlowService } from './core/services/chatflow.service';
import { integrationService } from './core/services/integration.service';
import { createServer } from './api/server';
import { closeDatabase } from './core/database/connection';

async function bootstrap() {
  console.log(`
=====================================================
          WhatsAman v1.0.0
   WhatsApp Dashboard by Aman Kerja Studio
=====================================================
Mode       : ${config.isPortable ? 'Portable (Zero Setup)' : 'Installed'}
Storage    : ${config.storage.baseDir}
Database   : SQLite (${config.storage.databasePath})
API Server : http://${config.server.host}:${config.server.port}
Swagger UI : http://${config.server.host}:${config.server.port}/docs
=====================================================
  `);

  try {
    // 1. Initialize SQLite Database Schema
    initializeDatabaseSchema();

    // 2. Initialize Message Persistence Service
    messageService.initialize();

    // 3. Initialize Automation Rule Service & Chatflow Engine
    automationService.initialize();
    chatFlowService.initialize();

    // 4. Initialize Outbound Webhook Dispatcher & Third-Party Webhook Ingestion
    webhookService.initialize();
    integrationService.initialize();

    // 5. Initialize Session Manager (Scans stored sessions & auto-reconnects)
    await sessionManager.initialize();

    // 6. Recover Interrupted Campaigns & Initialize Scheduled Watcher (30s interval)
    campaignService.recoverInterruptedCampaigns();
    campaignService.startScheduledCampaignWatcher(30000);

    // 7. Start HTTP & WebSocket Server
    const { server } = createServer();

    server.listen(config.server.port, config.server.host, () => {
      logger.info(`Server successfully listening on http://${config.server.host}:${config.server.port}`);
      logger.info(`Interactive API docs available at http://${config.server.host}:${config.server.port}/docs`);
    });

    // Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
      });
      closeDatabase();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    logger.fatal({ err: err.message, stack: err.stack }, 'Fatal error during startup');
    process.exit(1);
  }
}

bootstrap();
