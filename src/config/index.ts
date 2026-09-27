import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  env: string;
  isPortable: boolean;
  server: {
    port: number;
    host: string;
    corsOrigins: string[];
    apiKey?: string;
  };
  storage: {
    baseDir: string;
    databasePath: string;
    sessionsDir: string;
    mediaDir: string;
    backupsDir: string;
    exportsDir: string;
  };
  whatsapp: {
    browser: [string, string, string];
    syncFullHistory: boolean;
    qrCodeTimeoutMs: number;
    reconnectMaxRetries: number;
  };
  campaign: {
    defaultRateLimitPerMin: number;
    defaultDelayMinSec: number;
    defaultDelayMaxSec: number;
    batchPauseAfter: number;
    batchPauseSeconds: number;
  };
}

// Determine base data directory (Portable by default, or LocalAppData if configured)
const isPortable = process.env.PORTABLE_MODE !== 'false';
const rootDir = process.cwd();

let baseDataDir = path.resolve(rootDir, 'data');
if (!isPortable && process.env.LOCALAPPDATA) {
  baseDataDir = path.join(process.env.LOCALAPPDATA, 'WhatsAppLocalHub');
}

// Ensure critical directories exist
const sessionsDir = path.join(baseDataDir, 'sessions');
const mediaDir = path.join(baseDataDir, 'media');
const backupsDir = path.join(baseDataDir, 'backups');
const exportsDir = path.join(baseDataDir, 'exports');

[baseDataDir, sessionsDir, mediaDir, backupsDir, exportsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  isPortable,
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '127.0.0.1',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
    apiKey: process.env.API_KEY || undefined
  },
  storage: {
    baseDir: baseDataDir,
    databasePath: path.join(baseDataDir, 'database.sqlite'),
    sessionsDir,
    mediaDir,
    backupsDir,
    exportsDir
  },
  whatsapp: {
    browser: ['WhatsAman', 'Desktop', '1.0.0'],
    syncFullHistory: false,
    qrCodeTimeoutMs: 60000,
    reconnectMaxRetries: 5
  },
  campaign: {
    defaultRateLimitPerMin: 20,
    defaultDelayMinSec: 5,
    defaultDelayMaxSec: 15,
    batchPauseAfter: 50,
    batchPauseSeconds: 60
  }
};
