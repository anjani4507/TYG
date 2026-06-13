/**
 * Focus Debt System
 * 
 * Tracks focus intensity and requires recovery sessions when intensity drops
 */

import { EventEmitter } from 'eventemitter3';

export interface FocusDebtConfig {
  intensityThreshold: number; // 0-1, default 0.7
  debtAccrualRate: number; // how much debt per point below threshold
  recoverySessionDuration: number; // in seconds
  debtExpiryDays: number; // days before debt expires
}

export interface DebtRecord {
  id: string;
  amount: number; // debt units
  createdAt: number;
  expiresAt: number;
  reason: string;
  recovered: boolean;
  recoveredAt?: number;
}

export interface FocusDebtState {
  totalDebt: number;
  activeDebt: number; // non-expired debt
  recoverySessionsRequired: number;
  recoverySessionsCompleted: number;
  lastDebtAccrualDate: number;
  debtHistory: DebtRecord[];
}

/**
 * Focus Debt Service
 */
export class FocusDebtService extends EventEmitter {
  private config: FocusDebtConfig = {
    intensityThreshold: 0.7,
    debtAccrualRate: 1.0,
    recoverySessionDuration: 1800, // 30 minutes
    debtExpiryDays: 7,
  };

  private state: FocusDebtState = {
    totalDebt: 0,
    activeDebt: 0,
    recoverySessionsRequired: 0,
    recoverySessionsCompleted: 0,
    lastDebtAccrualDate: Date.now(),
    debtHistory: [],
  };

  /**
   * Record session intensity and accrue debt if below threshold
   */
  recordSessionIntensity(intensity: number, sessionDuration: number): void {
    if (intensity < this.config.intensityThreshold) {
      const debtAmount =
        (this.config.intensityThreshold - intensity) *
        this.config.debtAccrualRate;

      this.accrueDebt(
        debtAmount,
        `Low intensity session: ${Math.round(intensity * 100)}%`
      );

      this.emit('debt-accrued', {
        amount: debtAmount,
        intensity,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Accrue debt
   */
  private accrueDebt(amount: number, reason: string): void {
    const debtRecord: DebtRecord = {
      id: `debt-${Date.now()}`,
      amount,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.debtExpiryDays * 24 * 60 * 60 * 1000,
      reason,
      recovered: false,
    };

    this.state.debtHistory.push(debtRecord);
    this.state.totalDebt += amount;
    this.updateActiveDebt();
    this.updateRecoverySessionsRequired();

    this.state.lastDebtAccrualDate = Date.now();
  }

  /**
   * Update active debt (remove expired)
   */
  private updateActiveDebt(): void {
    const now = Date.now();
    let activeDebt = 0;

    this.state.debtHistory.forEach((record) => {
      if (!record.recovered && record.expiresAt > now) {
        activeDebt += record.amount;
      }
    });

    this.state.activeDebt = activeDebt;
  }

  /**
   * Update recovery sessions required
   */
  private updateRecoverySessionsRequired(): void {
    // 1 recovery session per 1.0 debt unit
    this.state.recoverySessionsRequired = Math.ceil(this.state.activeDebt);
  }

  /**
   * Complete a recovery session
   */
  completeRecoverySession(intensity: number): boolean {
    if (this.state.recoverySessionsRequired <= 0) {
      return false;
    }

    // Only count as recovery if intensity is high
    if (intensity >= 0.85) {
      this.state.recoverySessionsCompleted++;

      // Mark oldest debt as recovered
      const unrecoveredDebts = this.state.debtHistory.filter(
        (d) => !d.recovered
      );
      if (unrecoveredDebts.length > 0) {
        unrecoveredDebts[0].recovered = true;
        unrecoveredDebts[0].recoveredAt = Date.now();
      }

      this.updateActiveDebt();
      this.updateRecoverySessionsRequired();

      this.emit('recovery-session-completed', {
        intensity,
        timestamp: Date.now(),
        remainingDebt: this.state.recoverySessionsRequired,
      });

      return true;
    }

    return false;
  }

  /**
   * Check if recovery session is required
   */
  isRecoverySessionRequired(): boolean {
    return this.state.recoverySessionsRequired > 0;
  }

  /**
   * Get recovery sessions remaining
   */
  getRecoverySessionsRemaining(): number {
    return Math.max(0, this.state.recoverySessionsRequired - this.state.recoverySessionsCompleted);
  }

  /**
   * Get debt status
   */
  getDebtStatus(): {
    totalDebt: number;
    activeDebt: number;
    recoverySessionsRequired: number;
    recoverySessionsCompleted: number;
    debtPercentage: number;
  } {
    const maxDebt = 10; // arbitrary max for percentage calculation
    const debtPercentage = Math.min(
      100,
      (this.state.activeDebt / maxDebt) * 100
    );

    return {
      totalDebt: this.state.totalDebt,
      activeDebt: this.state.activeDebt,
      recoverySessionsRequired: this.state.recoverySessionsRequired,
      recoverySessionsCompleted: this.state.recoverySessionsCompleted,
      debtPercentage,
    };
  }

  /**
   * Get debt history
   */
  getDebtHistory(): DebtRecord[] {
    return [...this.state.debtHistory];
  }

  /**
   * Get active debt records
   */
  getActiveDebtRecords(): DebtRecord[] {
    const now = Date.now();
    return this.state.debtHistory.filter(
      (d) => !d.recovered && d.expiresAt > now
    );
  }

  /**
   * Get recovery session recommendation
   */
  getRecoveryRecommendation(): string {
    if (!this.isRecoverySessionRequired()) {
      return '✅ No recovery sessions needed. Keep up the focus!';
    }

    const remaining = this.getRecoverySessionsRemaining();
    const totalMinutes = (remaining * this.config.recoverySessionDuration) / 60;

    return `⚠️ You need ${remaining} recovery session(s) (~${Math.round(totalMinutes)} minutes) to restore your focus debt.`;
  }

  /**
   * Update config
   */
  updateConfig(newConfig: Partial<FocusDebtConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateRecoverySessionsRequired();
    this.emit('config-updated', { config: this.config });
  }

  /**
   * Get config
   */
  getConfig(): FocusDebtConfig {
    return { ...this.config };
  }

  /**
   * Reset debt (for testing)
   */
  resetDebt(): void {
    this.state = {
      totalDebt: 0,
      activeDebt: 0,
      recoverySessionsRequired: 0,
      recoverySessionsCompleted: 0,
      lastDebtAccrualDate: Date.now(),
      debtHistory: [],
    };

    this.emit('debt-reset', { timestamp: Date.now() });
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton focus debt service
 */
let globalFocusDebtService: FocusDebtService | null = null;

export function getGlobalFocusDebtService(): FocusDebtService {
  if (!globalFocusDebtService) {
    globalFocusDebtService = new FocusDebtService();
  }
  return globalFocusDebtService;
}

export function resetGlobalFocusDebtService(): void {
  if (globalFocusDebtService) {
    globalFocusDebtService.destroy();
    globalFocusDebtService = null;
  }
}
