import fs from 'fs';
import path from 'path';
import { config } from '../../config';
import { getDatabase } from '../database/connection';
import { logger } from '../../utils/logger';

import { AuditService } from './audit.service';

export class BackupService {
  public async createBackup(): Promise<{ backupFileName: string; filePath: string; sizeBytes: number }> {
    const db = getDatabase();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `WhatsAppLocalHub-${dateStr}.wahub`;
    const destPath = path.join(config.storage.backupsDir, backupFileName);

    logger.info({ destPath }, 'Creating database backup in .wahub format...');
    await db.backup(destPath);

    const stats = fs.statSync(destPath);
    AuditService.log('user', 'backup.create', 'database', { fileName: backupFileName, size: stats.size });

    return {
      backupFileName,
      filePath: destPath,
      sizeBytes: stats.size
    };
  }

  public listBackups(): Array<{ fileName: string; size: number; createdAt: number }> {
    const dir = config.storage.backupsDir;
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir);
    return files
      .map((f) => {
        const full = path.join(dir, f);
        const stats = fs.statSync(full);
        return {
          fileName: f,
          size: stats.size,
          createdAt: stats.birthtimeMs
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const backupService = new BackupService();
