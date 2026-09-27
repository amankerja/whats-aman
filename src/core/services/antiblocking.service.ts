import { getDatabase } from '../database/connection';
import { logger } from '../../utils/logger';
import { eventBus } from '../events/event-bus';

export interface AntiBlockingConfig {
  dailyCapNewSession: number;
  dailyCapEstablished: number;
  warmupRampUpDays: number;
  circuitBreakerThresholdPercent: number;
  consecutiveFailureLimit: number;
  operatingHoursOnly: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  adminAlertPhone?: string;
}

export class AntiBlockingGuardService {
  private defaultConfig: AntiBlockingConfig = {
    dailyCapNewSession: 50,
    dailyCapEstablished: 500,
    warmupRampUpDays: 7,
    circuitBreakerThresholdPercent: 15,
    consecutiveFailureLimit: 5,
    operatingHoursOnly: false, // Default false to allow manual user broadcasts, configurable via settings
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00'
  };

  public getConfig(): AntiBlockingConfig {
    const db = getDatabase();
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'anti_blocking_config'").get() as any;
      if (row?.value) {
        return { ...this.defaultConfig, ...JSON.parse(row.value) };
      }
    } catch {
      // fallback
    }
    return this.defaultConfig;
  }

  public updateConfig(config: Partial<AntiBlockingConfig>): void {
    const db = getDatabase();
    const current = this.getConfig();
    const updated = { ...current, ...config };
    const now = Date.now();
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('anti_blocking_config', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(JSON.stringify(updated), now);
    logger.info('Anti-blocking configuration updated');
  }

  public canDispatchMessage(sessionId: string): { allowed: boolean; reason?: string } {
    const cfg = this.getConfig();
    const today = new Date().toISOString().split('T')[0];
    const stats = this.getOrCreateStats(sessionId);

    // Reset daily stats on date change
    if (stats.last_sent_date !== today) {
      this.resetDailyStats(sessionId, today);
      stats.daily_sent_count = 0;
      stats.daily_failed_count = 0;
    }

    // 1. Operating Hours Check
    if (cfg.operatingHoursOnly && !this.isWithinOperatingHours(cfg.operatingHoursStart, cfg.operatingHoursEnd)) {
      return {
        allowed: false,
        reason: `Pengiriman ditunda: Di luar jam operasional (${cfg.operatingHoursStart} - ${cfg.operatingHoursEnd})`
      };
    }

    // 2. Daily Rate Limit & Session Warm-up
    const maxDailyCap = this.calculateDailyCap(stats.created_at, cfg);
    if (stats.daily_sent_count >= maxDailyCap) {
      return {
        allowed: false,
        reason: `Batas pengiriman harian tercapai (${stats.daily_sent_count}/${maxDailyCap} pesan/hari). Mencegah deteksi bot.`
      };
    }

    // 3. Circuit Breaker Check
    if (stats.is_circuit_broken) {
      return {
        allowed: false,
        reason: 'Circuit Breaker aktif! Sesi diistirahatkan sementara karena rasio kegagalan pesan tinggi.'
      };
    }

    return { allowed: true };
  }

  public recordSendResult(sessionId: string, success: boolean, errorMessage?: string): void {
    const db = getDatabase();
    const cfg = this.getConfig();
    const stats = this.getOrCreateStats(sessionId);
    const today = new Date().toISOString().split('T')[0];

    const newSent = stats.daily_sent_count + 1;
    const newFailed = success ? stats.daily_failed_count : stats.daily_failed_count + 1;
    const consecutiveFailures = success ? 0 : stats.consecutive_failures + 1;

    // Risk Score Calculation (0 - 100)
    let riskScore = 0;
    const failureRate = newSent > 0 ? (newFailed / newSent) * 100 : 0;
    if (failureRate > 20) riskScore += 40;
    else if (failureRate > 10) riskScore += 20;

    if (consecutiveFailures >= 3) riskScore += 30;

    const cap = this.calculateDailyCap(stats.created_at, cfg);
    if (newSent / cap > 0.9) riskScore += 20;

    riskScore = Math.min(100, riskScore);

    // Circuit Breaker Activation
    let breakCircuit = stats.is_circuit_broken;
    if (
      !breakCircuit &&
      (consecutiveFailures >= cfg.consecutiveFailureLimit ||
        (newSent >= 10 && failureRate >= cfg.circuitBreakerThresholdPercent))
    ) {
      breakCircuit = 1;
      this.logRiskEvent(sessionId, 'HIGH_FAILURE_RATE', 'HIGH', `Circuit breaker activated. ${consecutiveFailures} failures or ${failureRate.toFixed(1)}% error rate.`);
      eventBus.emit('session.risk_alert', { sessionId, riskScore, reason: 'High Failure Rate / Circuit Breaker' });
    }

    db.prepare(`
      UPDATE session_anti_blocking_stats
      SET daily_sent_count = ?,
          daily_failed_count = ?,
          consecutive_failures = ?,
          risk_score = ?,
          is_circuit_broken = ?,
          last_sent_date = ?,
          updated_at = ?
      WHERE session_id = ?
    `).run(newSent, newFailed, consecutiveFailures, riskScore, breakCircuit, today, Date.now(), sessionId);
  }

  public resetCircuitBreaker(sessionId: string): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE session_anti_blocking_stats
      SET is_circuit_broken = 0, consecutive_failures = 0, risk_score = 0, updated_at = ?
      WHERE session_id = ?
    `).run(Date.now(), sessionId);
    logger.info({ sessionId }, 'Circuit breaker manually reset');
  }

  public calculateDailyCap(createdAtMs: number, cfg: AntiBlockingConfig): number {
    const daysOld = Math.max(1, Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24)));
    if (daysOld >= cfg.warmupRampUpDays) {
      return cfg.dailyCapEstablished;
    }
    const step = Math.floor((cfg.dailyCapEstablished - cfg.dailyCapNewSession) / cfg.warmupRampUpDays);
    return cfg.dailyCapNewSession + (daysOld - 1) * step;
  }

  public getStats(sessionId: string): any {
    return this.getOrCreateStats(sessionId);
  }

  public getRiskEvents(sessionId: string, limit = 50): any[] {
    const db = getDatabase();
    return db.prepare('SELECT * FROM risk_events WHERE session_id = ? ORDER BY created_at DESC LIMIT ?').all(sessionId, limit) as any[];
  }

  private isWithinOperatingHours(startStr: string, endStr: string): boolean {
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTimeStr >= startStr && currentTimeStr <= endStr;
  }

  private getOrCreateStats(sessionId: string): any {
    const db = getDatabase();
    let row = db.prepare('SELECT * FROM session_anti_blocking_stats WHERE session_id = ?').get(sessionId) as any;
    if (!row) {
      const now = Date.now();
      const today = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO session_anti_blocking_stats (session_id, created_at, warmup_day_count, daily_sent_count, daily_failed_count, last_sent_date, risk_score, updated_at)
        VALUES (?, ?, 1, 0, 0, ?, 0, ?)
      `).run(sessionId, now, today, now);
      row = db.prepare('SELECT * FROM session_anti_blocking_stats WHERE session_id = ?').get(sessionId);
    }
    return row;
  }

  private resetDailyStats(sessionId: string, dateStr: string): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE session_anti_blocking_stats
      SET daily_sent_count = 0, daily_failed_count = 0, consecutive_failures = 0, is_circuit_broken = 0, last_sent_date = ?, updated_at = ?
      WHERE session_id = ?
    `).run(dateStr, Date.now(), sessionId);
  }

  private logRiskEvent(sessionId: string, eventType: string, severity: string, details: string): void {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO risk_events (id, session_id, event_type, severity, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`risk_${Date.now()}`, sessionId, eventType, severity, details, Date.now());
  }
}

export const antiBlockingGuardService = new AntiBlockingGuardService();
