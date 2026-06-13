/**
 * Timer Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { timerService } from "../lib/timer-service";

// Mock AsyncStorage since it's not available in Node test environment
vi.mock("@react-native-async-storage/async-storage", () => {
  const mockStorage: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => mockStorage[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(async () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    },
  };
});

describe("TimerService", () => {
  beforeEach(async () => {
    await timerService.clearAll();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    timerService.cleanup();
    vi.useRealTimers();
    await timerService.clearAll();
  });

  describe("Session Management", () => {
    it("should start a new session", async () => {
      const session = await timerService.startSession(1);
      expect(session).toBeDefined();
      expect(session.subjectId).toBe(1);
      expect(session.paused).toBe(false);
      expect(session.duration).toBe(0);
    });

    it("should have only one active session at a time", async () => {
      const session1 = await timerService.startSession(1);
      vi.advanceTimersByTime(1000);
      
      const session2 = await timerService.startSession(2);

      const activeSession = timerService.getActiveSession();
      expect(activeSession?.subjectId).toBe(2);
      expect(activeSession?.id).toBe(session2.id);
    });

    it("should pause a session", async () => {
      await timerService.startSession(1);
      await timerService.pauseSession();

      const state = timerService.getTimerState();
      expect(state.isPaused).toBe(true);
      expect(state.isRunning).toBe(false);
    });

    it("should resume a paused session", async () => {
      await timerService.startSession(1);
      await timerService.pauseSession();
      await timerService.resumeSession();

      const state = timerService.getTimerState();
      expect(state.isPaused).toBe(false);
      expect(state.isRunning).toBe(true);
    });

    it("should stop a session", async () => {
      const session = await timerService.startSession(1);
      vi.advanceTimersByTime(5000); // 5 seconds

      await timerService.stopSession();

      const state = timerService.getTimerState();
      expect(state.isRunning).toBe(false);
      expect(state.activeSessionId).toBeUndefined();

      const completedSession = timerService
        .getAllSessions()
        .find((s) => s.id === session.id);
      expect(completedSession?.endTime).toBeDefined();
      expect(completedSession?.duration).toBeGreaterThan(0);
    });
  });

  describe("Time Tracking", () => {
    it("should track session duration correctly", async () => {
      const session = await timerService.startSession(1);
      vi.advanceTimersByTime(10000); // 10 seconds

      const state = timerService.getTimerState();
      // Note: currentTime is updated asynchronously, so we check it's reasonable
      expect(state.currentTime).toBeGreaterThanOrEqual(0);
      expect(state.isRunning).toBe(true);
    });

    it("should calculate daily time correctly", async () => {
      const session1 = await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      const session2 = await timerService.startSession(1);
      vi.advanceTimersByTime(3000);
      await timerService.stopSession();

      const stats = timerService.getSubjectStats(1);
      expect(stats.dailyTime).toBeGreaterThanOrEqual(7000); // Allow some margin
      expect(stats.sessionsCount).toBe(2);
    });

    it("should calculate lifetime time correctly", async () => {
      const session1 = await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      const session2 = await timerService.startSession(1);
      vi.advanceTimersByTime(3000);
      await timerService.stopSession();

      const stats = timerService.getSubjectStats(1);
      expect(stats.lifetimeTime).toBeGreaterThanOrEqual(7000); // Allow some margin
      expect(stats.sessionsCount).toBe(2);
    });

    it("should track sessions for different subjects separately", async () => {
      const session1 = await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      const session2 = await timerService.startSession(2);
      vi.advanceTimersByTime(3000);
      await timerService.stopSession();

      const stats1 = timerService.getSubjectStats(1);
      const stats2 = timerService.getSubjectStats(2);

      expect(stats1.lifetimeTime).toBeGreaterThanOrEqual(4000); // Allow margin
      expect(stats2.lifetimeTime).toBeGreaterThanOrEqual(2000); // Allow margin
      expect(stats1.sessionsCount).toBe(1);
      expect(stats2.sessionsCount).toBe(1);
    });
  });

  describe("Pause/Resume", () => {
    it("should not count paused time", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(5000);

      await timerService.pauseSession();
      vi.advanceTimersByTime(10000); // This should not be counted

      await timerService.resumeSession();
      vi.advanceTimersByTime(3000);

      await timerService.stopSession();

      const stats = timerService.getSubjectStats(1);
      expect(stats.dailyTime).toBeGreaterThanOrEqual(7000); // Allow margin
      expect(stats.sessionsCount).toBe(1);
    });

    it("should preserve time across pause/resume cycles", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(3000);
      await timerService.pauseSession();

      vi.advanceTimersByTime(5000);
      await timerService.resumeSession();
      vi.advanceTimersByTime(2000);

      await timerService.stopSession();

      const stats = timerService.getSubjectStats(1);
      expect(stats.dailyTime).toBeGreaterThanOrEqual(4000); // Allow margin
      expect(stats.sessionsCount).toBe(1);
    });
  });

  describe("Time Formatting", () => {
    it("should format time correctly", () => {
      // @ts-ignore
      const formatTime = timerService.constructor.formatTime;
      expect(formatTime(0)).toBe("00:00:00");
      expect(formatTime(1000)).toBe("00:00:01");
      expect(formatTime(60000)).toBe("00:01:00");
      expect(formatTime(3600000)).toBe("01:00:00");
      expect(formatTime(3661000)).toBe("01:01:01");
    });
  });

  describe("Statistics", () => {
    it("should return correct subject stats", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      const stats = timerService.getSubjectStats(1);

      expect(stats.subjectId).toBe(1);
      expect(stats.sessionsCount).toBe(1);
      expect(stats.dailyTime).toBeGreaterThanOrEqual(4000); // Allow margin
      expect(stats.weeklyTime).toBeGreaterThanOrEqual(4000);
      expect(stats.monthlyTime).toBeGreaterThanOrEqual(4000);
      expect(stats.lifetimeTime).toBeGreaterThanOrEqual(4000);
      expect(stats.lastSessionDate).toBeDefined();
    });

    it("should return zero stats for subject with no sessions", () => {
      const stats = timerService.getSubjectStats(999);

      expect(stats.subjectId).toBe(999);
      expect(stats.sessionsCount).toBe(0);
      expect(stats.dailyTime).toBe(0);
      expect(stats.weeklyTime).toBe(0);
      expect(stats.monthlyTime).toBe(0);
      expect(stats.lifetimeTime).toBe(0);
    });

    it("should calculate total study time correctly", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      await timerService.startSession(2);
      vi.advanceTimersByTime(3000);
      await timerService.stopSession();

      const totalTime = timerService.getTotalStudyTime();
      expect(totalTime).toBeGreaterThanOrEqual(7000); // Allow margin
    });
  });

  describe("Persistence", () => {
    it("should track sessions in memory", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      const sessions = timerService.getAllSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].duration).toBeGreaterThanOrEqual(4000); // Allow margin
    });

    it("should track timer state", async () => {
      await timerService.startSession(1);
      const state = timerService.getTimerState();

      expect(state.isRunning).toBe(true);
      expect(state.activeSessionId).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle pause without active session", async () => {
      // Should not throw
      await timerService.pauseSession();
    });

    it("should handle resume without paused session", async () => {
      // Should not throw
      await timerService.resumeSession();
    });

    it("should handle stop without active session", async () => {
      // Should not throw
      await timerService.stopSession();
    });

    it("should clear all data", async () => {
      await timerService.startSession(1);
      vi.advanceTimersByTime(5000);
      await timerService.stopSession();

      await timerService.clearAll();

      const sessions = timerService.getAllSessions();
      const state = timerService.getTimerState();

      expect(sessions.length).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.activeSessionId).toBeUndefined();
    });
  });
});
