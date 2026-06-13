/**
 * Unit Tests for Core Services
 * 
 * Tests for Leaderboard, Distraction Audit, and Focus Debt services
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { leaderboardService } from '@/lib/_core/leaderboard';
import { DistractionAuditService } from '@/lib/_core/distraction-audit';
import { FocusDebtService } from '@/lib/_core/focus-debt';

describe('Leaderboard Service', () => {
  it('should calculate consistency score', () => {
    const stats = {
      userId: '1',
      userName: 'Test User',
      avatar: '👤',
      totalSessions: 100,
      totalFocusTime: 360000, // 100 hours
      avgIntensity: 0.85,
      currentStreak: 30,
      longestStreak: 50,
      lastSessionDate: Date.now(),
      badges: [],
    };

    const leaderboard = leaderboardService.generateLeaderboard([stats], 'consistency');
    expect(leaderboard.entries[0].score).toBeGreaterThan(0);
    expect(leaderboard.entries[0].rank).toBe(1);
  });

  it('should calculate intensity score', () => {
    const stats = {
      userId: '1',
      userName: 'Test User',
      avatar: '👤',
      totalSessions: 50,
      totalFocusTime: 180000, // 50 hours
      avgIntensity: 0.95,
      currentStreak: 10,
      longestStreak: 20,
      lastSessionDate: Date.now(),
      badges: [],
    };

    const leaderboard = leaderboardService.generateLeaderboard([stats], 'intensity');
    expect(leaderboard.entries[0].score).toBeGreaterThan(0);
  });

  it('should rank users correctly', () => {
    const users = [
      {
        userId: '1',
        userName: 'User 1',
        avatar: '👤',
        totalSessions: 100,
        totalFocusTime: 360000,
        avgIntensity: 0.9,
        currentStreak: 30,
        longestStreak: 50,
        lastSessionDate: Date.now(),
        badges: [],
      },
      {
        userId: '2',
        userName: 'User 2',
        avatar: '👤',
        totalSessions: 50,
        totalFocusTime: 180000,
        avgIntensity: 0.7,
        currentStreak: 10,
        longestStreak: 20,
        lastSessionDate: Date.now(),
        badges: [],
      },
    ];

    const leaderboard = leaderboardService.generateLeaderboard(users, 'combined');
    expect(leaderboard.entries[0].rank).toBe(1);
    expect(leaderboard.entries[1].rank).toBe(2);
    expect(leaderboard.entries[0].score).toBeGreaterThanOrEqual(
      leaderboard.entries[1].score
    );
  });

  it('should calculate badges correctly', () => {
    const stats = {
      userId: '1',
      userName: 'Test User',
      avatar: '👤',
      totalSessions: 150,
      totalFocusTime: 400000, // 111 hours
      avgIntensity: 0.92,
      currentStreak: 35,
      longestStreak: 100,
      lastSessionDate: Date.now(),
      badges: [],
    };

    const badges = leaderboardService.calculateBadges(stats);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges.some((b) => b.includes('Streak'))).toBe(true);
  });

  it('should get user rank', () => {
    const users = [
      {
        userId: '1',
        userName: 'User 1',
        avatar: '👤',
        totalSessions: 100,
        totalFocusTime: 360000,
        avgIntensity: 0.9,
        currentStreak: 30,
        longestStreak: 50,
        lastSessionDate: Date.now(),
        badges: [],
      },
    ];

    const rank = leaderboardService.getUserRank('1', users, 'combined');
    expect(rank).not.toBeNull();
    expect(rank?.rank).toBe(1);
  });

  it('should get top users', () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-${i}`,
      userName: `User ${i}`,
      avatar: '👤',
      totalSessions: 100 - i * 10,
      totalFocusTime: 360000 - i * 36000,
      avgIntensity: 0.9 - i * 0.05,
      currentStreak: 30 - i * 2,
      longestStreak: 50 - i * 3,
      lastSessionDate: Date.now(),
      badges: [],
    }));

    const topUsers = leaderboardService.getTopUsers(users, 'combined', 5);
    expect(topUsers.length).toBe(5);
    expect(topUsers[0].rank).toBe(1);
  });
});

describe('Distraction Audit Service', () => {
  let audit: DistractionAuditService;

  beforeEach(() => {
    audit = new DistractionAuditService();
  });

  it('should categorize apps correctly', () => {
    audit.recordDistractionEvent('Instagram', 300, 'session-1');
    audit.recordDistractionEvent('WhatsApp', 120, 'session-1');
    audit.recordDistractionEvent('YouTube', 600, 'session-1');

    const events = audit.getEvents();
    expect(events[0].category).toBe('social-media');
    expect(events[1].category).toBe('messaging');
    expect(events[2].category).toBe('entertainment');
  });

  it('should track distraction events', () => {
    audit.recordDistractionEvent('Instagram', 300, 'session-1');
    audit.recordDistractionEvent('WhatsApp', 120, 'session-1');

    const events = audit.getEvents();
    expect(events.length).toBe(2);
    expect(events[0].duration).toBe(300);
    expect(events[1].duration).toBe(120);
  });

  it('should generate weekly audit', () => {
    const now = Date.now();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    audit.recordDistractionEvent('Instagram', 300, 'session-1');
    audit.recordDistractionEvent('WhatsApp', 120, 'session-1');

    const auditReport = audit.generateWeeklyAudit(
      weekStart,
      now,
      10, // totalSessions
      36000, // totalFocusTime (10 hours)
      0.85 // avgIntensity
    );

    expect(auditReport.totalSessions).toBe(10);
    expect(auditReport.totalFocusTime).toBe(36000);
    expect(auditReport.avgIntensity).toBe(0.85);
    expect(auditReport.distractionRate).toBeGreaterThan(0);
    expect(auditReport.recommendations.length).toBeGreaterThan(0);
    expect(auditReport.score).toBeGreaterThan(0);
  });

  it('should calculate distraction rate', () => {
    const now = Date.now();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    audit.recordDistractionEvent('Instagram', 3600, 'session-1'); // 1 hour

    const auditReport = audit.generateWeeklyAudit(
      weekStart,
      now,
      1,
      3600, // 1 hour focus time
      0.5
    );

    // distractionRate = 3600 / (3600 + 3600) = 0.5 = 50%
    expect(auditReport.distractionRate).toBeCloseTo(50, 0);
  });

  it('should identify top distractions', () => {
    const now = Date.now();
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;

    audit.recordDistractionEvent('Instagram', 300, 'session-1');
    audit.recordDistractionEvent('Instagram', 300, 'session-1');
    audit.recordDistractionEvent('WhatsApp', 120, 'session-1');

    const auditReport = audit.generateWeeklyAudit(
      weekStart,
      now,
      1,
      3600,
      0.7
    );

    expect(auditReport.topDistractions.length).toBeGreaterThan(0);
    expect(auditReport.topDistractions[0]).toBe('Instagram');
  });
});

describe('Focus Debt Service', () => {
  let debt: FocusDebtService;

  beforeEach(() => {
    debt = new FocusDebtService();
  });

  it('should accrue debt for low intensity sessions', () => {
    debt.recordSessionIntensity(0.5, 1800); // 50% intensity

    const status = debt.getDebtStatus();
    expect(status.activeDebt).toBeGreaterThan(0);
  });

  it('should not accrue debt for high intensity sessions', () => {
    debt.recordSessionIntensity(0.85, 1800); // 85% intensity (above threshold)

    const status = debt.getDebtStatus();
    expect(status.activeDebt).toBe(0);
  });

  it('should require recovery sessions', () => {
    debt.recordSessionIntensity(0.5, 1800);
    debt.recordSessionIntensity(0.6, 1800);

    expect(debt.isRecoverySessionRequired()).toBe(true);
    expect(debt.getRecoverySessionsRemaining()).toBeGreaterThan(0);
  });

  it('should complete recovery sessions', () => {
    debt.recordSessionIntensity(0.5, 1800);

    const initialRemaining = debt.getRecoverySessionsRemaining();
    const completed = debt.completeRecoverySession(0.9); // High intensity

    expect(completed).toBe(true);
    expect(debt.getRecoverySessionsRemaining()).toBeLessThan(initialRemaining);
  });

  it('should reject low intensity recovery sessions', () => {
    debt.recordSessionIntensity(0.5, 1800);

    const completed = debt.completeRecoverySession(0.6); // Low intensity

    expect(completed).toBe(false);
  });

  it('should track debt history', () => {
    debt.recordSessionIntensity(0.5, 1800);
    debt.recordSessionIntensity(0.6, 1800);

    const history = debt.getDebtHistory();
    expect(history.length).toBe(2);
    expect(history[0].amount).toBeGreaterThan(0);
  });

  it('should provide recovery recommendations', () => {
    debt.recordSessionIntensity(0.5, 1800);

    const recommendation = debt.getRecoveryRecommendation();
    expect(recommendation).toContain('recovery session');
  });

  it('should reset debt', () => {
    debt.recordSessionIntensity(0.5, 1800);
    expect(debt.getDebtStatus().activeDebt).toBeGreaterThan(0);

    debt.resetDebt();
    expect(debt.getDebtStatus().activeDebt).toBe(0);
  });
});
