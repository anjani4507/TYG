/**
 * Focus-State Monitor
 * 
 * Tracks user focus using:
 * - React Native AppState (background/foreground)
 * - Screen visibility
 * - User interaction patterns
 * - Calculates Focus Intensity as ratio of active-screen time vs background time
 */

import { AppState, type AppStateStatus } from 'react-native';
import { EventEmitter } from 'eventemitter3';

export type FocusState = 'focused' | 'distracted' | 'idle' | 'unknown';

export interface FocusMetrics {
  focusState: FocusState;
  focusIntensity: number; // 0-1, where 1 is perfect focus
  activeScreenTime: number; // in seconds
  backgroundTime: number; // in seconds
  totalTime: number; // in seconds
  distractionEvents: number;
  lastInteractionTime: number; // timestamp
  focusDuration: number; // current focus session duration
}

export interface FocusEvent {
  type: 'focus-change' | 'distraction' | 'idle' | 'resume';
  timestamp: number;
  metrics: FocusMetrics;
  reason?: string;
}

/**
 * Focus-State Monitor - Tracks focus intensity and state
 */
export class FocusStateMonitor extends EventEmitter {
  private focusState: FocusState = 'unknown';
  private focusIntensity: number = 1.0;
  private activeScreenTime: number = 0;
  private backgroundTime: number = 0;
  private startTime: number = Date.now();
  private lastInteractionTime: number = Date.now();
  private distractionEvents: number = 0;
  private appState: AppStateStatus = 'active';
  private appStateSubscription: any = null;
  private focusDuration: number = 0;
  private lastFocusChangeTime: number = Date.now();
  private isMonitoring: boolean = false;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private idleThreshold: number = 5000; // 5 seconds of no interaction = idle
  private distractionThreshold: number = 10000; // 10 seconds background = distraction

  constructor() {
    super();
  }

  /**
   * Start monitoring focus state
   */
  start() {
    if (this.isMonitoring) {
      console.warn('Focus monitor already started');
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.lastInteractionTime = Date.now();
    this.focusState = 'focused';
    this.focusIntensity = 1.0;

    // Setup app state listener
    this.appStateSubscription = AppState.addEventListener('change', (state) => {
      this.handleAppStateChange(state);
    });

    // Start monitoring loop
    this.monitorInterval = setInterval(() => this.updateFocusMetrics(), 1000) as any;

    this.emit('start', {
      type: 'focus-change',
      timestamp: Date.now(),
      metrics: this.getMetrics(),
    });
  }

  /**
   * Stop monitoring focus state
   */
  stop() {
    if (!this.isMonitoring) {
      console.warn('Focus monitor not started');
      return;
    }

    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.appStateSubscription) {
      try {
        this.appStateSubscription.remove();
      } catch (error) {
        console.warn('Failed to remove app state subscription:', error);
      }
      this.appStateSubscription = null;
    }

    this.emit('stop', {
      type: 'focus-change',
      timestamp: Date.now(),
      metrics: this.getMetrics(),
    });
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(state: AppStateStatus) {
    const previousState = this.appState;
    this.appState = state;

    if (state === 'background') {
      // App went to background
      this.handleBackgroundTransition();
    } else if (state === 'active' && previousState === 'background') {
      // App returned to foreground
      this.handleForegroundTransition();
    }
  }

  /**
   * Handle transition to background
   */
  private handleBackgroundTransition() {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;

    if (timeSinceLastInteraction > this.distractionThreshold) {
      // User was idle before going to background
      this.updateFocusState('idle');
    } else {
      // User went to background while active
      this.updateFocusState('distracted');
      this.distractionEvents++;
    }
  }

  /**
   * Handle transition to foreground
   */
  private handleForegroundTransition() {
    const now = Date.now();
    this.lastInteractionTime = now;

    // If was distracted, emit distraction event
    if (this.focusState === 'distracted') {
      this.emit('distraction', {
        type: 'distraction',
        timestamp: now,
        metrics: this.getMetrics(),
        reason: 'App backgrounded',
      });
    }

    // Resume focus
    this.updateFocusState('focused');
  }

  /**
   * Record user interaction
   */
  recordInteraction() {
    const now = Date.now();
    const wasIdle = this.focusState === 'idle';

    this.lastInteractionTime = now;

    if (wasIdle) {
      this.updateFocusState('focused');
      this.emit('resume', {
        type: 'resume',
        timestamp: now,
        metrics: this.getMetrics(),
      });
    }
  }

  /**
   * Update focus state and emit event if changed
   */
  private updateFocusState(newState: FocusState) {
    if (newState === this.focusState) {
      return;
    }

    const previousState = this.focusState;
    this.focusState = newState;
    this.lastFocusChangeTime = Date.now();

    // Update intensity based on state
    switch (newState) {
      case 'focused':
        this.focusIntensity = Math.min(1.0, this.focusIntensity + 0.1);
        break;
      case 'distracted':
        this.focusIntensity = Math.max(0.5, this.focusIntensity - 0.3);
        break;
      case 'idle':
        this.focusIntensity = Math.max(0.3, this.focusIntensity - 0.2);
        break;
    }

    this.emit('focus-change', {
      type: 'focus-change',
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      reason: `State changed from ${previousState} to ${newState}`,
    });
  }

  /**
   * Update focus metrics (called periodically)
   */
  private updateFocusMetrics() {
    const now = Date.now();
    const totalElapsed = (now - this.startTime) / 1000;
    const timeSinceLastInteraction = (now - this.lastInteractionTime) / 1000;

    // Check for idle state
    if (timeSinceLastInteraction > this.idleThreshold / 1000 && this.focusState !== 'idle') {
      this.updateFocusState('idle');
    }

    // Update active screen time
    if (this.appState === 'active' && this.focusState !== 'idle') {
      this.activeScreenTime += 1; // 1 second per tick
      this.focusDuration += 1;
    } else if (this.appState === 'background') {
      this.backgroundTime += 1;
    }

    // Calculate focus intensity
    this.calculateFocusIntensity();
  }

  /**
   * Calculate focus intensity as ratio of active time to total time
   */
  private calculateFocusIntensity() {
    const totalTime = this.activeScreenTime + this.backgroundTime;

    if (totalTime === 0) {
      this.focusIntensity = 1.0;
      return;
    }

    // Base intensity on active screen time ratio
    const screenTimeRatio = this.activeScreenTime / totalTime;
    const baseIntensity = screenTimeRatio * 0.8 + 0.2; // 0.2 - 1.0 range

    // Apply distraction penalty
    const distractionPenalty = (this.distractionEvents / Math.max(1, totalTime / 60)) * 0.1;
    this.focusIntensity = Math.max(0.3, baseIntensity - distractionPenalty);
  }

  /**
   * Get current focus metrics
   */
  getMetrics(): FocusMetrics {
    const totalTime = (Date.now() - this.startTime) / 1000;

    return {
      focusState: this.focusState,
      focusIntensity: this.focusIntensity,
      activeScreenTime: Math.round(this.activeScreenTime),
      backgroundTime: Math.round(this.backgroundTime),
      totalTime: Math.round(totalTime),
      distractionEvents: this.distractionEvents,
      lastInteractionTime: this.lastInteractionTime,
      focusDuration: Math.round(this.focusDuration),
    };
  }

  /**
   * Get focus state
   */
  getFocusState(): FocusState {
    return this.focusState;
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
    return this.distractionEvents;
  }

  /**
   * Reset monitor
   */
  reset() {
    this.focusState = 'unknown';
    this.focusIntensity = 1.0;
    this.activeScreenTime = 0;
    this.backgroundTime = 0;
    this.startTime = Date.now();
    this.lastInteractionTime = Date.now();
    this.distractionEvents = 0;
    this.focusDuration = 0;
  }

  /**
   * Destroy monitor
   */
  destroy() {
    this.stop();
    this.removeAllListeners();
  }
}

/**
 * Singleton focus monitor instance
 */
let globalFocusMonitor: FocusStateMonitor | null = null;

export function getGlobalFocusMonitor(): FocusStateMonitor {
  if (!globalFocusMonitor) {
    globalFocusMonitor = new FocusStateMonitor();
  }
  return globalFocusMonitor;
}

export function resetGlobalFocusMonitor() {
  if (globalFocusMonitor) {
    globalFocusMonitor.destroy();
    globalFocusMonitor = null;
  }
}
