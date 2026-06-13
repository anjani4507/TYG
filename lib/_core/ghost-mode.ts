/**
 * Ghost Mode Service
 * 
 * Privacy feature that hides user progress during sprint
 * Results are revealed after sprint completion
 */

import { EventEmitter } from 'eventemitter3';

export interface GhostModeConfig {
  enabled: boolean;
  hideProgressDuringSprint: boolean;
  revealAfterCompletion: boolean;
  hideName: boolean;
  hideAvatar: boolean;
}

export interface GhostModeState {
  isActive: boolean;
  isHidden: boolean;
  revealTime?: number;
}

/**
 * Ghost Mode Service
 */
export class GhostModeService extends EventEmitter {
  private config: GhostModeConfig = {
    enabled: false,
    hideProgressDuringSprint: true,
    revealAfterCompletion: true,
    hideName: false,
    hideAvatar: false,
  };

  private state: GhostModeState = {
    isActive: false,
    isHidden: false,
  };

  private revealTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Enable ghost mode
   */
  enable(): void {
    this.config.enabled = true;
    this.emit('enabled', { timestamp: Date.now() });
  }

  /**
   * Disable ghost mode
   */
  disable(): void {
    this.config.enabled = false;
    this.reveal();
    this.emit('disabled', { timestamp: Date.now() });
  }

  /**
   * Start ghost mode for sprint
   */
  startSprintGhostMode(sprintDuration: number): void {
    if (!this.config.enabled) {
      return;
    }

    this.state.isActive = true;
    this.state.isHidden = this.config.hideProgressDuringSprint;

    this.emit('sprint-started', {
      timestamp: Date.now(),
      isHidden: this.state.isHidden,
    });

    // Schedule reveal after sprint completion
    if (this.config.revealAfterCompletion) {
      this.revealTimeout = setTimeout(() => {
        this.reveal();
      }, sprintDuration * 1000);

      this.state.revealTime = Date.now() + sprintDuration * 1000;
    }
  }

  /**
   * Reveal progress (end ghost mode)
   */
  reveal(): void {
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
      this.revealTimeout = null;
    }

    this.state.isActive = false;
    this.state.isHidden = false;
    this.state.revealTime = undefined;

    this.emit('revealed', { timestamp: Date.now() });
  }

  /**
   * Check if progress should be hidden
   */
  isProgressHidden(): boolean {
    return this.state.isHidden;
  }

  /**
   * Check if name should be hidden
   */
  isNameHidden(): boolean {
    return this.config.enabled && this.state.isHidden && this.config.hideName;
  }

  /**
   * Check if avatar should be hidden
   */
  isAvatarHidden(): boolean {
    return this.config.enabled && this.state.isHidden && this.config.hideAvatar;
  }

  /**
   * Get ghost mode state
   */
  getState(): GhostModeState {
    return { ...this.state };
  }

  /**
   * Get ghost mode config
   */
  getConfig(): GhostModeConfig {
    return { ...this.config };
  }

  /**
   * Update ghost mode config
   */
  updateConfig(newConfig: Partial<GhostModeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', { config: this.config, timestamp: Date.now() });
  }

  /**
   * Get time until reveal (in seconds)
   */
  getTimeUntilReveal(): number {
    if (!this.state.revealTime) {
      return 0;
    }

    const remaining = (this.state.revealTime - Date.now()) / 1000;
    return Math.max(0, remaining);
  }

  /**
   * Get masked name
   */
  getMaskedName(originalName: string): string {
    if (!this.isNameHidden()) {
      return originalName;
    }

    // Return generic name like "Participant 1"
    return `Participant ${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Get masked avatar
   */
  getMaskedAvatar(originalAvatar: string): string {
    if (!this.isAvatarHidden()) {
      return originalAvatar;
    }

    // Return generic avatar
    return '👤';
  }

  /**
   * Destroy service
   */
  destroy(): void {
    if (this.revealTimeout) {
      clearTimeout(this.revealTimeout);
      this.revealTimeout = null;
    }

    this.removeAllListeners();
  }
}

/**
 * Singleton ghost mode service
 */
let globalGhostModeService: GhostModeService | null = null;

export function getGlobalGhostModeService(): GhostModeService {
  if (!globalGhostModeService) {
    globalGhostModeService = new GhostModeService();
  }
  return globalGhostModeService;
}

export function resetGlobalGhostModeService(): void {
  if (globalGhostModeService) {
    globalGhostModeService.destroy();
    globalGhostModeService = null;
  }
}
