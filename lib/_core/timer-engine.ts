/**
 * Deep Work Timer Engine
 * 
 * Decoupled timer service that:
 * - Runs independently from UI
 * - Supports background operation
 * - Handles system wake-locks
 * - Provides pause/resume functionality
 * - Emits tick events for UI updates
 */

import { EventEmitter } from 'eventemitter3';
import { AppState, type AppStateStatus } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerEvent {
  type: 'tick' | 'start' | 'pause' | 'resume' | 'complete' | 'break' | 'distraction';
  timestamp: number;
  elapsed: number;
  remaining: number;
  intensity?: number;
}

export interface TimerConfig {
  duration: number; // in seconds
  breakDuration?: number; // in seconds
  enableWakeLock?: boolean;
  enableBackgroundOperation?: boolean;
  tickInterval?: number; // in milliseconds, default 1000
}

/**
 * Deep Work Timer Engine - Core timer logic decoupled from UI
 */
export class DeepWorkTimerEngine extends EventEmitter {
  private status: TimerStatus = 'idle';
  private config: Required<TimerConfig>;
  private elapsed: number = 0;
  private paused: number = 0; // Time spent paused
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;
  private appState: AppStateStatus = 'active';
  private backgroundStartTime: number = 0;
  private focusIntensity: number = 1.0; // 1.0 = perfect focus, 0.0 = no focus
  private distractionCount: number = 0;
  private lastTickTime: number = Date.now();

  constructor(config: TimerConfig) {
    super();
    this.config = {
      duration: config.duration,
      breakDuration: config.breakDuration || 300, // 5 minutes default
      enableWakeLock: config.enableWakeLock ?? true,
      enableBackgroundOperation: config.enableBackgroundOperation ?? true,
      tickInterval: config.tickInterval ?? 1000,
    };

    // Setup app state listener
    this.setupAppStateListener();
  }

  /**
   * Setup app state listener for background/foreground transitions
   */
  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (state) => {
      this.handleAppStateChange(state);
    });
  }

  /**
   * Handle app state changes (background/foreground)
   */
  private handleAppStateChange(state: AppStateStatus) {
    const previousState = this.appState;
    this.appState = state;

    if (state === 'background') {
      this.backgroundStartTime = Date.now();
      if (this.status === 'running' && !this.config.enableBackgroundOperation) {
        this.pause();
      }
    } else if (state === 'active' && previousState === 'background') {
      // App returned to foreground
      if (this.backgroundStartTime > 0) {
        const backgroundDuration = Date.now() - this.backgroundStartTime;
        this.calculateFocusIntensity(backgroundDuration);
        this.backgroundStartTime = 0;
      }
    }
  }

  /**
   * Calculate focus intensity based on background time
   */
  private calculateFocusIntensity(backgroundDuration: number) {
    // Penalize for background time
    const maxBackgroundPenalty = 0.3; // Max 30% penalty
    const backgroundPenalty = Math.min(
      (backgroundDuration / 10000) * maxBackgroundPenalty,
      maxBackgroundPenalty
    );
    this.focusIntensity = Math.max(1.0 - backgroundPenalty, 0.7);

    // Emit distraction alert if background time > 5 seconds
    if (backgroundDuration > 5000) {
      this.distractionCount++;
      this.emit('distraction', {
        type: 'distraction',
        timestamp: Date.now(),
        elapsed: this.elapsed,
        remaining: this.config.duration - this.elapsed,
        backgroundDuration,
        distractionCount: this.distractionCount,
      });
    }
  }

  /**
   * Start the timer
   */
  start() {
    if (this.status !== 'idle') {
      console.warn('Timer already started');
      return;
    }

    // Validate config
    if (this.config.duration <= 0) {
      console.error('Invalid timer duration');
      return;
    }

    this.status = 'running';
    this.elapsed = 0;
    this.paused = 0;
    this.focusIntensity = 1.0;
    this.distractionCount = 0;
    this.lastTickTime = Date.now();

    // Enable wake lock if configured
    if (this.config.enableWakeLock) {
      try {
        useKeepAwake();
      } catch (error) {
        console.warn('Failed to enable wake lock:', error);
      }
    }

    // Start tick interval
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    this.tickInterval = setInterval(() => this.tick(), this.config.tickInterval) as any;

    this.emit('start', {
      type: 'start',
      timestamp: Date.now(),
      elapsed: this.elapsed,
      remaining: this.config.duration,
    });
  }

  /**
   * Pause the timer
   */
  pause() {
    if (this.status !== 'running') {
      console.warn('Timer is not running');
      return;
    }

    this.status = 'paused';
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.lastTickTime = Date.now();

    this.emit('pause', {
      type: 'pause',
      timestamp: Date.now(),
      elapsed: this.elapsed,
      remaining: this.config.duration - this.elapsed,
      intensity: this.focusIntensity,
    });
  }

  /**
   * Resume the timer
   */
  resume() {
    if (this.status !== 'paused') {
      console.warn('Timer is not paused');
      return;
    }

    this.status = 'running';
    this.lastTickTime = Date.now();
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    this.tickInterval = setInterval(() => this.tick(), this.config.tickInterval) as any;

    this.emit('resume', {
      type: 'resume',
      timestamp: Date.now(),
      elapsed: this.elapsed,
      remaining: this.config.duration - this.elapsed,
      intensity: this.focusIntensity,
    });
  }

  /**
   * Stop the timer and mark as completed
   */
  stop() {
    if (this.status === 'idle' || this.status === 'completed') {
      console.warn('Timer is not active');
      return;
    }

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.status = 'completed';

    this.emit('complete', {
      type: 'complete',
      timestamp: Date.now(),
      elapsed: this.elapsed,
      remaining: 0,
      intensity: this.focusIntensity,
      distractionCount: this.distractionCount,
    });
  }

  /**
   * Internal tick handler
   */
  private tick() {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;
    this.lastTickTime = now;

    this.elapsed += deltaTime / 1000; // Convert to seconds

    // Check if time is up
    if (this.elapsed >= this.config.duration) {
      this.elapsed = this.config.duration;
      this.stop();
      return;
    }

    // Emit tick event
    this.emit('tick', {
      type: 'tick',
      timestamp: now,
      elapsed: Math.floor(this.elapsed),
      remaining: Math.ceil(this.config.duration - this.elapsed),
      intensity: this.focusIntensity,
    });
  }

  /**
   * Get current timer state
   */
  getState() {
    return {
      status: this.status,
      elapsed: Math.floor(this.elapsed),
      remaining: Math.max(0, Math.ceil(this.config.duration - this.elapsed)),
      duration: this.config.duration,
      focusIntensity: this.focusIntensity,
      distractionCount: this.distractionCount,
      appState: this.appState,
    };
  }

  /**
   * Set focus intensity manually (for testing or external input)
   */
  setFocusIntensity(intensity: number) {
    this.focusIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Get focus intensity
   */
  getFocusIntensity(): number {
    return this.focusIntensity;
  }

  /**
   * Get distraction count
   */
  getDistractionCount(): number {
    return this.distractionCount;
  }

  /**
   * Reset timer
   */
  reset() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.status = 'idle';
    this.elapsed = 0;
    this.paused = 0;
    this.focusIntensity = 1.0;
    this.distractionCount = 0;
  }

  /**
   * Cleanup and destroy timer
   */
  destroy() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.removeAllListeners();
  }
}

/**
 * Factory function to create timer instance
 */
export function createDeepWorkTimer(config: TimerConfig): DeepWorkTimerEngine {
  return new DeepWorkTimerEngine(config);
}

/**
 * Singleton timer instance for app-wide use
 */
let globalTimer: DeepWorkTimerEngine | null = null;

export function getGlobalTimer(): DeepWorkTimerEngine | null {
  return globalTimer;
}

export function setGlobalTimer(timer: DeepWorkTimerEngine) {
  globalTimer = timer;
}

export function clearGlobalTimer() {
  if (globalTimer) {
    globalTimer.destroy();
    globalTimer = null;
  }
}
