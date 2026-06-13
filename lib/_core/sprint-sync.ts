/**
 * Synchronized Sprints Service
 * 
 * Syncs all group member timers within a 3-second window
 */

import { EventEmitter } from 'eventemitter3';

export type SprintStatus = 'idle' | 'waiting' | 'syncing' | 'active' | 'completed';

export interface SprintMember {
  userId: string;
  userName: string;
  status: 'ready' | 'syncing' | 'active' | 'completed';
  joinedAt: number;
  timerOffset: number; // milliseconds offset from sync point
}

export interface SprintConfig {
  duration: number; // in seconds
  syncWindow: number; // in milliseconds, default 3000 (3 seconds)
  groupId: string;
  sprintId: string;
}

export interface SprintEvent {
  type: 'created' | 'member-joined' | 'sync-start' | 'sync-complete' | 'sprint-start' | 'sprint-end';
  timestamp: number;
  sprintId: string;
  data?: any;
}

/**
 * Synchronized Sprints Service
 */
export class SynchronizedSprintService extends EventEmitter {
  private status: SprintStatus = 'idle';
  private config: SprintConfig | null = null;
  private members: Map<string, SprintMember> = new Map();
  private syncStartTime: number = 0;
  private sprintStartTime: number = 0;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;
  private sprintInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Create a new sprint
   */
  createSprint(config: SprintConfig, currentUserId: string): void {
    if (this.status !== 'idle') {
      console.warn('Sprint already in progress');
      return;
    }

    this.config = config;
    this.status = 'waiting';
    this.members.clear();

    // Add current user as first member
    this.members.set(currentUserId, {
      userId: currentUserId,
      userName: 'You',
      status: 'ready',
      joinedAt: Date.now(),
      timerOffset: 0,
    });

    this.emit('created', {
      type: 'created',
      timestamp: Date.now(),
      sprintId: config.sprintId,
      data: { config },
    });
  }

  /**
   * Join an existing sprint
   */
  joinSprint(userId: string, userName: string): boolean {
    if (!this.config || this.status === 'active' || this.status === 'completed') {
      console.warn('Cannot join sprint in current state');
      return false;
    }

    const joinedAt = Date.now();
    const timeSinceSyncStart = joinedAt - this.syncStartTime;

    // Check if within sync window
    if (this.status === 'syncing' && timeSinceSyncStart > this.config.syncWindow) {
      console.warn('Join request outside sync window');
      return false;
    }

    this.members.set(userId, {
      userId,
      userName,
      status: this.status === 'syncing' ? 'syncing' : 'ready',
      joinedAt,
      timerOffset: timeSinceSyncStart,
    });

    this.emit('member-joined', {
      type: 'member-joined',
      timestamp: Date.now(),
      sprintId: this.config.sprintId,
      data: { userId, userName, memberCount: this.members.size },
    });

    return true;
  }

  /**
   * Start the sync window (3 seconds)
   */
  startSync(): void {
    if (!this.config || this.status !== 'waiting') {
      console.warn('Cannot start sync in current state');
      return;
    }

    this.status = 'syncing';
    this.syncStartTime = Date.now();

    // Update all members to syncing status
    this.members.forEach((member) => {
      member.status = 'syncing';
    });

    this.emit('sync-start', {
      type: 'sync-start',
      timestamp: Date.now(),
      sprintId: this.config!.sprintId,
      data: { syncWindow: this.config!.syncWindow },
    });

    // Wait for sync window to complete
    this.syncTimeout = setTimeout(() => {
      this.completeSyncWindow();
    }, this.config.syncWindow);
  }

  /**
   * Complete sync window and start sprint
   */
  private completeSyncWindow(): void {
    if (!this.config || this.status !== 'syncing') {
      return;
    }

    this.emit('sync-complete', {
      type: 'sync-complete',
      timestamp: Date.now(),
      sprintId: this.config.sprintId,
      data: { memberCount: this.members.size },
    });

    // Start the actual sprint
    this.startSprintSession();
  }

  /**
   * Start the sprint session
   */
  private startSprintSession(): void {
    if (!this.config) {
      return;
    }

    this.status = 'active';
    this.sprintStartTime = Date.now();

    // Update all members to active status
    this.members.forEach((member) => {
      member.status = 'active';
    });

    this.emit('sprint-start', {
      type: 'sprint-start',
      timestamp: Date.now(),
      sprintId: this.config.sprintId,
      data: { duration: this.config.duration, memberCount: this.members.size },
    });

    // Start sprint timer
    this.sprintInterval = setInterval(() => {
      this.checkSprintCompletion();
    }, 1000);
  }

  /**
   * Check if sprint is completed
   */
  private checkSprintCompletion(): void {
    if (!this.config) {
      return;
    }

    const elapsed = (Date.now() - this.sprintStartTime) / 1000;

    if (elapsed >= this.config.duration) {
      this.endSprint();
    }
  }

  /**
   * End the sprint
   */
  endSprint(): void {
    if (!this.config || this.status !== 'active') {
      console.warn('Cannot end sprint in current state');
      return;
    }

    if (this.sprintInterval) {
      clearInterval(this.sprintInterval);
      this.sprintInterval = null;
    }

    this.status = 'completed';

    // Update all members to completed status
    this.members.forEach((member) => {
      member.status = 'completed';
    });

    this.emit('sprint-end', {
      type: 'sprint-end',
      timestamp: Date.now(),
      sprintId: this.config.sprintId,
      data: { memberCount: this.members.size },
    });
  }

  /**
   * Get sprint status
   */
  getStatus(): SprintStatus {
    return this.status;
  }

  /**
   * Get sprint members
   */
  getMembers(): SprintMember[] {
    return Array.from(this.members.values());
  }

  /**
   * Get member count
   */
  getMemberCount(): number {
    return this.members.size;
  }

  /**
   * Get elapsed time in sprint (in seconds)
   */
  getElapsedTime(): number {
    if (this.status !== 'active') {
      return 0;
    }

    return (Date.now() - this.sprintStartTime) / 1000;
  }

  /**
   * Get remaining time in sprint (in seconds)
   */
  getRemainingTime(): number {
    if (!this.config || this.status !== 'active') {
      return 0;
    }

    const elapsed = this.getElapsedTime();
    return Math.max(0, this.config.duration - elapsed);
  }

  /**
   * Get sync window progress (0-1)
   */
  getSyncProgress(): number {
    if (this.status !== 'syncing' || !this.config) {
      return 0;
    }

    const elapsed = Date.now() - this.syncStartTime;
    return Math.min(1, elapsed / this.config.syncWindow);
  }

  /**
   * Get sprint progress (0-1)
   */
  getSprintProgress(): number {
    if (this.status !== 'active' || !this.config) {
      return 0;
    }

    const elapsed = this.getElapsedTime();
    return Math.min(1, elapsed / this.config.duration);
  }

  /**
   * Reset sprint
   */
  reset(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    if (this.sprintInterval) {
      clearInterval(this.sprintInterval);
      this.sprintInterval = null;
    }

    this.status = 'idle';
    this.config = null;
    this.members.clear();
    this.syncStartTime = 0;
    this.sprintStartTime = 0;
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.reset();
    this.removeAllListeners();
  }
}

/**
 * Singleton sprint service
 */
let globalSprintService: SynchronizedSprintService | null = null;

export function getGlobalSprintService(): SynchronizedSprintService {
  if (!globalSprintService) {
    globalSprintService = new SynchronizedSprintService();
  }
  return globalSprintService;
}

export function resetGlobalSprintService(): void {
  if (globalSprintService) {
    globalSprintService.destroy();
    globalSprintService = null;
  }
}
