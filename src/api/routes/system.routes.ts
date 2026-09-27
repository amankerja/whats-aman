import { Router, Request, Response, NextFunction } from 'express';
import os from 'os';
import { backupService } from '../../core/services/backup.service';
import { sessionManager } from '../../core/engine/session.manager';
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
      appName: 'WhatsApp Local Hub',
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

// POST /api/v1/system/backup - Trigger point-in-time SQLite backup
systemRouter.post('/backup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const backup = await backupService.createBackup();
    res.json({ success: true, message: 'Backup created successfully', data: backup });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/system/backups - List all backups
systemRouter.get('/backups', (req: Request, res: Response) => {
  const backups = backupService.listBackups();
  res.json({ success: true, data: backups });
});
