import { Router, Request, Response, NextFunction } from 'express';
import os from 'os';
import { backupService } from '../../core/services/backup.service';
import { sessionManager } from '../../core/engine/session.manager';
import { AuditService } from '../../core/services/audit.service';
import { antiBlockingGuardService } from '../../core/services/antiblocking.service';
import { config } from '../../config';

export const systemRouter = Router();

// GET /api/v1/system/status - Health, memory, session counts
systemRouter.get('/status', (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const sessions = sessionManager.getAllSessions();
  const connected = sessions.filter((s) => s.status === 'CONNECTED').length;

  res.json({
    success: true,
    data: {
      appName: 'WhatsAman',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      isPortable: config.isPortable,
      storageDir: config.storage.baseDir,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        totalSystemMemMb: Math.round(os.totalmem() / 1024 / 1024),
        freeSystemMemMb: Math.round(os.freemem() / 1024 / 1024)
      },
      sessions: {
        total: sessions.length,
        connected
      }
    }
  });
});

// POST /api/v1/system/backup & /backups/create - Trigger point-in-time SQLite backup
const handleCreateBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await backupService.createBackup();
    res.json({ success: true, message: 'Backup created successfully', data: backup });
  } catch (err) {
    next(err);
  }
};

systemRouter.post('/backup', handleCreateBackup);
systemRouter.post('/backups/create', handleCreateBackup);

// GET /api/v1/system/backups - List all backups
systemRouter.get('/backups', (req: Request, res: Response) => {
  const backups = backupService.listBackups();
  res.json({ success: true, data: backups });
});

// GET /api/v1/system/audit - List audit logs (PRD Section 24 & 34)
systemRouter.get('/audit', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
  const logs = AuditService.getRecent(limit);
  res.json({ success: true, data: logs });
});

// GET /api/v1/system/anti-blocking/config - Get Anti-Blocking configuration
systemRouter.get('/anti-blocking/config', (req: Request, res: Response) => {
  const cfg = antiBlockingGuardService.getConfig();
  res.json({ success: true, data: cfg });
});

// POST /api/v1/system/anti-blocking/config - Update Anti-Blocking configuration
systemRouter.post('/anti-blocking/config', (req: Request, res: Response) => {
  antiBlockingGuardService.updateConfig(req.body);
  res.json({ success: true, message: 'Anti-Blocking configuration updated' });
});

// GET /api/v1/system/anti-blocking/stats - Get session risk stats & events
systemRouter.get('/anti-blocking/stats', (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '');
  if (!sessionId) {
    res.status(400).json({ success: false, message: 'sessionId is required' });
    return;
  }
  const stats = antiBlockingGuardService.getStats(sessionId);
  const events = antiBlockingGuardService.getRiskEvents(sessionId);
  res.json({ success: true, data: { stats, events } });
});

// POST /api/v1/system/anti-blocking/reset-circuit - Reset Circuit Breaker for session
systemRouter.post('/anti-blocking/reset-circuit', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ success: false, message: 'sessionId is required' });
    return;
  }
  antiBlockingGuardService.resetCircuitBreaker(sessionId);
  res.json({ success: true, message: 'Circuit breaker reset successfully' });
});
