/**
 * Timer Service
 * 
 * Manages study sessions, time tracking, and persistence
 * Handles subject-based timing with daily/weekly/monthly/lifetime statistics
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface TimerSession {
  id: string;
  subjectId: number;
  startTime: number;
  endTime?: number;
  duration: number; // in milliseconds
  date: string; // YYYY-MM-DD
  paused: boolean;
  pausedAt?: number;
}

export interface SubjectStats {
  subjectId: number;
  currentSessionTime: number;
  dailyTime: number;
  weeklyTime: number;
  monthlyTime: number;
  lifetimeTime: number;
  sessionsCount: number;
  lastSessionDate?: string;
}

export interface TimerState {
  activeSessionId?: string;
  isRunning: boolean;
  isPaused: boolean;
  currentTime: number; // in milliseconds
}

class TimerService {
  private sessions: TimerSession[] = [];
  private timerState: TimerState = {
    isRunning: false,
    isPaused: false,
    currentTime: 0,
  };
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private storageKey = "timer_sessions";
  private stateKey = "timer_state";

  /**
   * Initialize timer service and load persisted data
   */
  async initialize(): Promise<void> {
    await this.loadSessions();
    await this.loadState();
  }

  /**
   * Load sessions from AsyncStorage
   */
  private async loadSessions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.sessions = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }

  /**
   * Load timer state from AsyncStorage
   */
  private async loadState(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.stateKey);
      if (stored) {
        this.timerState = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load timer state:", error);
    }
  }

  /**
   * Save sessions to AsyncStorage
   */
  private async saveSessions(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
    } catch (error) {
      console.error("Failed to save sessions:", error);
    }
  }

  /**
   * Save timer state to AsyncStorage
   */
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.stateKey, JSON.stringify(this.timerState));
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  }

  /**
   * Start a new session for a subject
   */
  async startSession(subjectId: number): Promise<TimerSession> {
    // Stop any existing session
    if (this.timerState.activeSessionId) {
      await this.stopSession();
    }

    const session: TimerSession = {
      id: `session_${Date.now()}`,
      subjectId,
      startTime: Date.now(),
      duration: 0,
      date: new Date().toISOString().split("T")[0],
      paused: false,
    };

    this.sessions.push(session);
    this.timerState.activeSessionId = session.id;
    this.timerState.isRunning = true;
    this.timerState.isPaused = false;
    this.timerState.currentTime = 0;

    await this.saveSessions();
    await this.saveState();

    this.startTimer();
    return session;
  }

  /**
   * Pause current session
   */
  async pauseSession(): Promise<void> {
    if (!this.timerState.activeSessionId) return;

    const session = this.sessions.find((s) => s.id === this.timerState.activeSessionId);
    if (!session) return;

    session.paused = true;
    session.pausedAt = Date.now();
    this.timerState.isPaused = true;
    this.timerState.isRunning = false;

    this.stopTimer();
    await this.saveSessions();
    await this.saveState();
  }

  /**
   * Resume paused session
   */
  async resumeSession(): Promise<void> {
    if (!this.timerState.activeSessionId) return;

    const session = this.sessions.find((s) => s.id === this.timerState.activeSessionId);
    if (!session || !session.paused) return;

    // Calculate how long this pause lasted
    const pauseGap = Date.now() - (session.pausedAt || Date.now());
    // Shift startTime forward by the pause gap so elapsed time calculation stays correct
    session.startTime += pauseGap;
    session.paused = false;
    session.pausedAt = undefined;

    this.timerState.isPaused = false;
    this.timerState.isRunning = true;

    this.startTimer();
    await this.saveSessions();
    await this.saveState();
  }

  /**
   * Stop current session
   */
  async stopSession(): Promise<void> {
    if (!this.timerState.activeSessionId) return;

    const session = this.sessions.find((s) => s.id === this.timerState.activeSessionId);
    if (!session) return;

    const endTime = Date.now();
    const totalDuration = session.paused
      ? (session.pausedAt || endTime) - session.startTime
      : endTime - session.startTime;

    session.endTime = endTime;
    session.duration = totalDuration;
    session.paused = false;

    this.timerState.activeSessionId = undefined;
    this.timerState.isRunning = false;
    this.timerState.isPaused = false;
    this.timerState.currentTime = 0;

    this.stopTimer();
    await this.saveSessions();
    await this.saveState();
  }

  /**
   * Start internal timer
   */
  private startTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.timerState.activeSessionId) {
        const session = this.sessions.find((s) => s.id === this.timerState.activeSessionId);
        if (session && !session.paused) {
          this.timerState.currentTime = Date.now() - session.startTime;
        }
      }
    }, 100); // Update every 100ms for smooth display
  }

  /**
   * Stop internal timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Get current timer state
   */
  getTimerState(): TimerState {
    return { ...this.timerState };
  }

  /**
   * Get active session
   */
  getActiveSession(): TimerSession | undefined {
    if (!this.timerState.activeSessionId) return undefined;
    return this.sessions.find((s) => s.id === this.timerState.activeSessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): TimerSession[] {
    return [...this.sessions];
  }

  /**
   * Get statistics for a subject
   */
  getSubjectStats(subjectId: number): SubjectStats {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const subjectSessions = this.sessions.filter((s) => s.subjectId === subjectId);

    const currentSession = this.getActiveSession();
    const currentSessionTime =
      currentSession && currentSession.subjectId === subjectId
        ? this.timerState.currentTime
        : 0;

    const dailyTime = subjectSessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.duration, 0);

    const weeklyTime = subjectSessions
      .filter((s) => s.date >= weekAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    const monthlyTime = subjectSessions
      .filter((s) => s.date >= monthAgo)
      .reduce((sum, s) => sum + s.duration, 0);

    const lifetimeTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);

    const lastSessionDate = subjectSessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((s) => s.date)[0];

    return {
      subjectId,
      currentSessionTime,
      dailyTime,
      weeklyTime,
      monthlyTime,
      lifetimeTime,
      sessionsCount: subjectSessions.length,
      lastSessionDate,
    };
  }

  /**
   * Format milliseconds to HH:MM:SS
   */
  static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Instance method wrapper for formatTime
   */
  formatTime(milliseconds: number): string {
    return TimerService.formatTime(milliseconds);
  }

  /**
   * Get total study time for all subjects
   */
  getTotalStudyTime(): number {
    const currentSession = this.getActiveSession();
    const completedTime = this.sessions.reduce((sum, s) => sum + s.duration, 0);
    const activeTime = currentSession ? this.timerState.currentTime : 0;
    return completedTime + activeTime;
  }

  /**
   * Clear all sessions (for testing)
   */
  async clearAll(): Promise<void> {
    this.sessions = [];
    this.timerState = {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
    };
    this.stopTimer();
    await this.saveSessions();
    await this.saveState();
  }

  /**
   * Cleanup on app close
   */
  cleanup(): void {
    this.stopTimer();
  }
}

// Export singleton instance
export const timerService = new TimerService();
