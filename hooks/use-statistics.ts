import { useEffect, useState } from 'react';
import { statisticsService, AnalyticsData, Achievement } from '@/lib/statistics-service';

export function useStatistics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAndLoad();
  }, []);

  const initializeAndLoad = async () => {
    try {
      await statisticsService.initialize();
      const data = statisticsService.getAnalytics();
      const achs = statisticsService.getAchievements();
      setAnalytics(data);
      setAchievements(achs);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordSession = async (subject: string, durationMinutes: number) => {
    try {
      await statisticsService.recordSession(subject, durationMinutes);
      const data = statisticsService.getAnalytics();
      const achs = statisticsService.getAchievements();
      setAnalytics(data);
      setAchievements(achs);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };

  const getUnlockedAchievements = () => {
    return statisticsService.getUnlockedAchievements();
  };

  const getAchievementProgress = () => {
    return statisticsService.getAchievementProgress();
  };

  const refresh = async () => {
    await initializeAndLoad();
  };

  return {
    analytics,
    achievements,
    loading,
    recordSession,
    getUnlockedAchievements,
    getAchievementProgress,
    refresh,
  };
}
