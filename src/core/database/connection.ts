import Database from 'better-sqlite3';
import { config } from '../../config';
import { logger } from '../../utils/logger';

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    logger.info({ path: config.storage.databasePath }, 'Connecting to SQLite database...');
    dbInstance = new Database(config.storage.databasePath);
    
    // Enable WAL mode for high concurrency & performance
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('synchronous = NORMAL');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.info('Database connection closed');
  }
}
