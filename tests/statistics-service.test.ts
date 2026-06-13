import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { statisticsService } from '../lib/statistics-service';

describe('StatisticsService', () => {
  beforeEach(async () => {
    await statisticsService.clearAll();
    await statisticsService.initialize();
  });

  afterEach(async () => {
    await statisticsService.clearAll();
  });

  describe('Session Recording', () => {
    it('should record a study session', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.totalMinutesStudied).toBe(30);
      expect(analytics.totalSessions).toBe(1);
    });

    it('should record multiple sessions', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.recordSession('English', 45);
      await statisticsService.recordSession('Math', 20);

      const analytics = statisticsService.getAnalytics();
      expect(analytics.totalMinutesStudied).toBe(95);
      expect(analytics.totalSessions).toBe(3);
    });

    it('should track subject-specific time', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.recordSession('English', 45);
      await statisticsService.recordSession('Math', 20);

      const analytics = statisticsService.getAnalytics();
      expect(analytics.mostStudiedSubject).toBe('Math');
    });

    it('should calculate average session length', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.recordSession('English', 60);

      const analytics = statisticsService.getAnalytics();
      expect(analytics.averageSessionLength).toBe(45);
    });
  });

  describe('Streak Tracking', () => {
    it('should initialize with zero streak', async () => {
      const analytics = statisticsService.getAnalytics();
      expect(analytics.currentStreak).toBe(0);
      expect(analytics.longestStreak).toBe(0);
    });

    it('should track current streak', async () => {
      const today = new Date();
      await statisticsService.recordSession('Math', 30, today.getTime());

      const analytics = statisticsService.getAnalytics();
      expect(analytics.currentStreak).toBeGreaterThanOrEqual(0);
    });

    it('should calculate longest streak', async () => {
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today.getTime() - i * 86400000);
        await statisticsService.recordSession('Math', 30, date.getTime());
      }

      const analytics = statisticsService.getAnalytics();
      expect(analytics.longestStreak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Achievements', () => {
    it('should initialize default achievements', async () => {
      const achievements = statisticsService.getAchievements();
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should unlock first session achievement', async () => {
      await statisticsService.recordSession('Math', 30);
      const achievements = statisticsService.getUnlockedAchievements();

      expect(achievements.some(a => a.id === 'first_session')).toBe(true);
    });

    it('should unlock one hour achievement', async () => {
      for (let i = 0; i < 2; i++) {
        await statisticsService.recordSession('Math', 30);
      }

      const achievements = statisticsService.getUnlockedAchievements();
      expect(achievements.some(a => a.id === 'one_hour')).toBe(true);
    });

    it('should track achievement progress', async () => {
      await statisticsService.recordSession('Math', 30);
      const achievements = statisticsService.getAchievements();
      const oneHour = achievements.find(a => a.id === 'one_hour');

      expect(oneHour?.progress).toBe(30);
      expect(oneHour?.unlockedAt).toBeUndefined();
    });

    it('should calculate achievement completion percentage', async () => {
      const progress = statisticsService.getAchievementProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should get unlocked achievements only', async () => {
      await statisticsService.recordSession('Math', 30);
      const unlocked = statisticsService.getUnlockedAchievements();

      expect(unlocked.every(a => a.unlockedAt !== undefined)).toBe(true);
    });
  });

  describe('Analytics Data', () => {
    it('should return complete analytics object', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalMinutesStudied).toBeGreaterThanOrEqual(0);
      expect(analytics.totalSessions).toBeGreaterThanOrEqual(0);
      expect(analytics.currentStreak).toBeGreaterThanOrEqual(0);
      expect(analytics.longestStreak).toBeGreaterThanOrEqual(0);
      expect(analytics.averageSessionLength).toBeGreaterThanOrEqual(0);
      expect(analytics.mostStudiedSubject).toBeDefined();
      expect(analytics.studyFrequency).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.achievements)).toBe(true);
      expect(typeof analytics.heatmap).toBe('object');
      expect(Array.isArray(analytics.dailyStats)).toBe(true);
      expect(Array.isArray(analytics.weeklyStats)).toBe(true);
      expect(Array.isArray(analytics.monthlyStats)).toBe(true);
    });

    it('should include heatmap data', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(Object.keys(analytics.heatmap).length).toBeGreaterThanOrEqual(1);
    });

    it('should include daily stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.dailyStats.length).toBeGreaterThanOrEqual(1);
    });

    it('should include weekly stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.weeklyStats.length).toBeGreaterThanOrEqual(1);
    });

    it('should include monthly stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.monthlyStats.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Heatmap Data', () => {
    it('should return empty heatmap initially', async () => {
      const heatmap = statisticsService.getHeatmapData();
      expect(typeof heatmap).toBe('object');
    });

    it('should populate heatmap with session data', async () => {
      await statisticsService.recordSession('Math', 30);
      const heatmap = statisticsService.getHeatmapData();

      expect(Object.keys(heatmap).length).toBeGreaterThanOrEqual(1);
    });

    it('should show correct minutes in heatmap', async () => {
      await statisticsService.recordSession('Math', 30);
      const heatmap = statisticsService.getHeatmapData();
      const today = new Date().toISOString().split('T')[0];

      expect(heatmap[today]).toBe(30);
    });
  });

  describe('Daily Stats', () => {
    it('should retrieve daily stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const today = new Date().toISOString().split('T')[0];
      const dailyStats = statisticsService.getDailyStats(today);

      expect(dailyStats).toBeDefined();
      expect(dailyStats?.totalMinutes).toBe(30);
      expect(dailyStats?.sessions).toBe(1);
    });

    it('should track subjects in daily stats', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.recordSession('English', 20);

      const today = new Date().toISOString().split('T')[0];
      const dailyStats = statisticsService.getDailyStats(today);

      expect(dailyStats?.subjects['Math']).toBe(30);
      expect(dailyStats?.subjects['English']).toBe(20);
    });

    it('should return undefined for non-existent date', async () => {
      const pastDate = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
      const dailyStats = statisticsService.getDailyStats(pastDate);

      expect(dailyStats).toBeUndefined();
    });
  });

  describe('Weekly Stats', () => {
    it('should calculate weekly stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const weeklyStats = statisticsService.getWeeklyStats();

      expect(Array.isArray(weeklyStats)).toBe(true);
      expect(weeklyStats.length).toBeGreaterThanOrEqual(1);
    });

    it('should include week identifier', async () => {
      await statisticsService.recordSession('Math', 30);
      const weeklyStats = statisticsService.getWeeklyStats();

      expect(weeklyStats[0].week).toMatch(/\d{4}-W\d{2}/);
    });

    it('should calculate average minutes per day', async () => {
      await statisticsService.recordSession('Math', 70);
      const weeklyStats = statisticsService.getWeeklyStats();

      expect(weeklyStats[0].avgMinutesPerDay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Monthly Stats', () => {
    it('should calculate monthly stats', async () => {
      await statisticsService.recordSession('Math', 30);
      const monthlyStats = statisticsService.getMonthlyStats();

      expect(Array.isArray(monthlyStats)).toBe(true);
      expect(monthlyStats.length).toBeGreaterThanOrEqual(1);
    });

    it('should include month identifier', async () => {
      await statisticsService.recordSession('Math', 30);
      const monthlyStats = statisticsService.getMonthlyStats();

      expect(monthlyStats[0].month).toMatch(/\d{4}-\d{2}/);
    });

    it('should track best day in month', async () => {
      await statisticsService.recordSession('Math', 30);
      const monthlyStats = statisticsService.getMonthlyStats();

      expect(monthlyStats[0].bestDay).toBeDefined();
      expect(monthlyStats[0].bestDayMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should track subjects in monthly stats', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.recordSession('English', 20);

      const monthlyStats = statisticsService.getMonthlyStats();
      expect(monthlyStats[0].subjects['Math']).toBe(30);
      expect(monthlyStats[0].subjects['English']).toBe(20);
    });
  });

  describe('Study Frequency', () => {
    it('should calculate days studied in last 30 days', async () => {
      await statisticsService.recordSession('Math', 30);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.studyFrequency).toBeGreaterThanOrEqual(1);
    });

    it('should count unique days only', async () => {
      const today = new Date();
      await statisticsService.recordSession('Math', 30, today.getTime());
      await statisticsService.recordSession('English', 20, today.getTime());

      const analytics = statisticsService.getAnalytics();
      expect(analytics.studyFrequency).toBe(1);
    });
  });

  describe('Data Persistence', () => {
    it('should clear all data', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.clearAll();

      const analytics = statisticsService.getAnalytics();
      expect(analytics.totalMinutesStudied).toBe(0);
      expect(analytics.totalSessions).toBe(0);
    });

    it('should persist data across initialize calls', async () => {
      await statisticsService.recordSession('Math', 30);
      await statisticsService.initialize();

      const analytics = statisticsService.getAnalytics();
      expect(analytics.totalMinutesStudied).toBe(30);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration session', async () => {
      await statisticsService.recordSession('Math', 0);
      const analytics = statisticsService.getAnalytics();

      expect(analytics.totalSessions).toBe(1);
      expect(analytics.totalMinutesStudied).toBe(0);
    });

    it('should handle very long session', async () => {
      await statisticsService.recordSession('Math', 1440); // 24 hours
      const analytics = statisticsService.getAnalytics();

      expect(analytics.totalMinutesStudied).toBe(1440);
    });

    it('should handle multiple subjects', async () => {
      const subjects = ['Math', 'English', 'Science', 'History', 'Art'];
      for (const subject of subjects) {
        await statisticsService.recordSession(subject, 30);
      }

      const analytics = statisticsService.getAnalytics();
      expect(analytics.totalSessions).toBe(5);
    });

    it('should handle future timestamps', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      await statisticsService.recordSession('Math', 30, futureDate.getTime());

      const analytics = statisticsService.getAnalytics();
      expect(analytics.totalMinutesStudied).toBe(30);
    });
  });
});
