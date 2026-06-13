import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessions: number;
  subjects: Record<string, number>; // subject -> minutes
  streak: number;
}

export interface WeeklyStats {
  week: string; // YYYY-W##
  totalMinutes: number;
  sessions: number;
  avgMinutesPerDay: number;
  subjects: Record<string, number>;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalMinutes: number;
  sessions: number;
  avgMinutesPerDay: number;
  subjects: Record<string, number>;
  bestDay: string;
  bestDayMinutes: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number; // timestamp
  progress: number; // 0-100
  requirement: number; // e.g., 100 for "100 hours studied"
  type: 'time' | 'streak' | 'consistency' | 'milestone';
}

export interface HeatmapData {
  [date: string]: number; // date -> minutes studied
}

export interface AnalyticsData {
  totalMinutesStudied: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionLength: number;
  mostStudiedSubject: string;
  studyFrequency: number; // days studied in last 30 days
  achievements: Achievement[];
  heatmap: HeatmapData;
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
}

const STORAGE_KEY = '@flowfocus_statistics';
const ACHIEVEMENTS_KEY = '@flowfocus_achievements';

class StatisticsService {
  private dailyStats: Map<string, DailyStats> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private currentStreak = 0;
  private longestStreak = 0;

  async initialize() {
    try {
      const [statsData, achievementsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ACHIEVEMENTS_KEY),
      ]);

      if (statsData) {
        const parsed = JSON.parse(statsData);
        this.dailyStats = new Map(parsed);
      }

      if (achievementsData) {
        const parsed = JSON.parse(achievementsData);
        this.achievements = new Map(parsed);
      } else {
        this.initializeDefaultAchievements();
      }

      this.calculateStreaks();
    } catch (error) {
      console.error('Error initializing statistics:', error);
    }
  }

  private initializeDefaultAchievements() {
    const defaults: Achievement[] = [
      {
        id: 'first_session',
        name: 'Getting Started',
        description: 'Complete your first study session',
        icon: '🚀',
        progress: 0,
        requirement: 1,
        type: 'milestone',
      },
      {
        id: 'one_hour',
        name: 'One Hour Club',
        description: 'Study for a total of 1 hour',
        icon: '⏱️',
        progress: 0,
        requirement: 60,
        type: 'time',
      },
      {
        id: 'ten_hours',
        name: 'Dedicated Learner',
        description: 'Study for a total of 10 hours',
        icon: '📚',
        progress: 0,
        requirement: 600,
        type: 'time',
      },
      {
        id: 'hundred_hours',
        name: 'Master Scholar',
        description: 'Study for a total of 100 hours',
        icon: '🎓',
        progress: 0,
        requirement: 6000,
        type: 'time',
      },
      {
        id: 'three_day_streak',
        name: 'On Fire',
        description: 'Maintain a 3-day study streak',
        icon: '🔥',
        progress: 0,
        requirement: 3,
        type: 'streak',
      },
      {
        id: 'seven_day_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day study streak',
        icon: '💪',
        progress: 0,
        requirement: 7,
        type: 'streak',
      },
      {
        id: 'thirty_day_streak',
        name: 'Unstoppable',
        description: 'Maintain a 30-day study streak',
        icon: '👑',
        progress: 0,
        requirement: 30,
        type: 'streak',
      },
      {
        id: 'consistency',
        name: 'Consistent',
        description: 'Study 20 days in a month',
        icon: '📅',
        progress: 0,
        requirement: 20,
        type: 'consistency',
      },
    ];

    defaults.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  async recordSession(
    subjectName: string,
    durationMinutes: number,
    timestamp: number = Date.now()
  ) {
    const date = new Date(timestamp);
    const dateStr = date.toISOString().split('T')[0];

    let dayStats = this.dailyStats.get(dateStr);
    if (!dayStats) {
      dayStats = {
        date: dateStr,
        totalMinutes: 0,
        sessions: 0,
        subjects: {},
        streak: 0,
      };
    }

    dayStats.totalMinutes += durationMinutes;
    dayStats.sessions += 1;
    dayStats.subjects[subjectName] = (dayStats.subjects[subjectName] || 0) + durationMinutes;

    this.dailyStats.set(dateStr, dayStats);
    this.calculateStreaks();
    this.updateAchievements();

    await this.save();
  }

  private calculateStreaks() {
    const sortedDates = Array.from(this.dailyStats.keys()).sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];

      if (date === expectedDate || (i === 0 && (date === today || date === yesterday))) {
        tempStreak++;
        if (i === 0 && date === today) {
          currentStreak = tempStreak;
        }
      } else {
        break;
      }
    }

    // Calculate longest streak
    let streak = 0;
    sortedDates.reverse().forEach(date => {
      const dayStats = this.dailyStats.get(date);
      if (dayStats && dayStats.totalMinutes > 0) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 0;
      }
    });

    this.currentStreak = currentStreak;
    this.longestStreak = longestStreak;
  }

  private updateAchievements() {
    const totalMinutes = Array.from(this.dailyStats.values()).reduce(
      (sum, day) => sum + day.totalMinutes,
      0
    );
    const totalSessions = Array.from(this.dailyStats.values()).reduce(
      (sum, day) => sum + day.sessions,
      0
    );

    // Update time-based achievements
    const timeAchievements = ['one_hour', 'ten_hours', 'hundred_hours'];
    timeAchievements.forEach(id => {
      const achievement = this.achievements.get(id);
      if (achievement) {
        achievement.progress = Math.min(totalMinutes, achievement.requirement);
        if (totalMinutes >= achievement.requirement && !achievement.unlockedAt) {
          achievement.unlockedAt = Date.now();
        }
      }
    });

    // Update streak achievements
    const streakAchievements = ['three_day_streak', 'seven_day_streak', 'thirty_day_streak'];
    streakAchievements.forEach(id => {
      const achievement = this.achievements.get(id);
      if (achievement) {
        achievement.progress = Math.min(this.currentStreak, achievement.requirement);
        if (this.currentStreak >= achievement.requirement && !achievement.unlockedAt) {
          achievement.unlockedAt = Date.now();
        }
      }
    });

    // Update first session achievement
    if (totalSessions > 0) {
      const firstSession = this.achievements.get('first_session');
      if (firstSession && !firstSession.unlockedAt) {
        firstSession.unlockedAt = Date.now();
        firstSession.progress = 1;
      }
    }

    // Update consistency achievement
    const last30Days = this.getLast30DaysStats();
    const daysStudied = last30Days.filter(day => day.totalMinutes > 0).length;
    const consistency = this.achievements.get('consistency');
    if (consistency) {
      consistency.progress = Math.min(daysStudied, consistency.requirement);
      if (daysStudied >= consistency.requirement && !consistency.unlockedAt) {
        consistency.unlockedAt = Date.now();
      }
    }
  }

  private getLast30DaysStats(): DailyStats[] {
    const stats: DailyStats[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const dayStats = this.dailyStats.get(date);
      if (dayStats) {
        stats.push(dayStats);
      }
    }
    return stats;
  }

  getHeatmapData(): HeatmapData {
    const heatmap: HeatmapData = {};
    this.dailyStats.forEach((stats, date) => {
      heatmap[date] = stats.totalMinutes;
    });
    return heatmap;
  }

  getDailyStats(date: string): DailyStats | undefined {
    return this.dailyStats.get(date);
  }

  getWeeklyStats(): WeeklyStats[] {
    const weeklyMap = new Map<string, WeeklyStats>();

    this.dailyStats.forEach((dayStats, dateStr) => {
      const date = new Date(dateStr);
      const weekNumber = this.getWeekNumber(date);
      const year = date.getFullYear();
      const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

      let weekStats = weeklyMap.get(weekKey);
      if (!weekStats) {
        weekStats = {
          week: weekKey,
          totalMinutes: 0,
          sessions: 0,
          avgMinutesPerDay: 0,
          subjects: {},
        };
      }

      weekStats.totalMinutes += dayStats.totalMinutes;
      weekStats.sessions += dayStats.sessions;
      Object.entries(dayStats.subjects).forEach(([subject, minutes]) => {
        weekStats!.subjects[subject] = (weekStats!.subjects[subject] || 0) + minutes;
      });

      weeklyMap.set(weekKey, weekStats);
    });

    return Array.from(weeklyMap.values())
      .map(week => ({
        ...week,
        avgMinutesPerDay: Math.round(week.totalMinutes / 7),
      }))
      .sort((a, b) => b.week.localeCompare(a.week));
  }

  getMonthlyStats(): MonthlyStats[] {
    const monthlyMap = new Map<string, MonthlyStats>();

    this.dailyStats.forEach((dayStats, dateStr) => {
      const monthKey = dateStr.substring(0, 7); // YYYY-MM

      let monthStats = monthlyMap.get(monthKey);
      if (!monthStats) {
        monthStats = {
          month: monthKey,
          totalMinutes: 0,
          sessions: 0,
          avgMinutesPerDay: 0,
          subjects: {},
          bestDay: '',
          bestDayMinutes: 0,
        };
      }

      monthStats.totalMinutes += dayStats.totalMinutes;
      monthStats.sessions += dayStats.sessions;

      if (dayStats.totalMinutes > monthStats.bestDayMinutes) {
        monthStats.bestDay = dateStr;
        monthStats.bestDayMinutes = dayStats.totalMinutes;
      }

      Object.entries(dayStats.subjects).forEach(([subject, minutes]) => {
        monthStats!.subjects[subject] = (monthStats!.subjects[subject] || 0) + minutes;
      });

      monthlyMap.set(monthKey, monthStats);
    });

    return Array.from(monthlyMap.values())
      .map(month => ({
        ...month,
        avgMinutesPerDay: Math.round(month.totalMinutes / 30),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  getAnalytics(): AnalyticsData {
    const totalMinutes = Array.from(this.dailyStats.values()).reduce(
      (sum, day) => sum + day.totalMinutes,
      0
    );
    const totalSessions = Array.from(this.dailyStats.values()).reduce(
      (sum, day) => sum + day.sessions,
      0
    );

    const allSubjects: Record<string, number> = {};
    this.dailyStats.forEach(dayStats => {
      Object.entries(dayStats.subjects).forEach(([subject, minutes]) => {
        allSubjects[subject] = (allSubjects[subject] || 0) + minutes;
      });
    });

    const mostStudiedSubject = Object.entries(allSubjects).sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

    const last30Days = this.getLast30DaysStats();
    const daysStudied = last30Days.filter(day => day.totalMinutes > 0).length;

    return {
      totalMinutesStudied: totalMinutes,
      totalSessions,
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      averageSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
      mostStudiedSubject,
      studyFrequency: daysStudied,
      achievements: Array.from(this.achievements.values()),
      heatmap: this.getHeatmapData(),
      dailyStats: Array.from(this.dailyStats.values()).sort((a, b) => b.date.localeCompare(a.date)),
      weeklyStats: this.getWeeklyStats(),
      monthlyStats: this.getMonthlyStats(),
    };
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).sort((a, b) => {
      if (a.unlockedAt && !b.unlockedAt) return -1;
      if (!a.unlockedAt && b.unlockedAt) return 1;
      return (b.unlockedAt || 0) - (a.unlockedAt || 0);
    });
  }

  getUnlockedAchievements(): Achievement[] {
    return this.getAchievements().filter(a => a.unlockedAt);
  }

  getAchievementProgress(): number {
    const unlocked = this.getUnlockedAchievements().length;
    const total = this.achievements.size;
    return Math.round((unlocked / total) * 100);
  }

  async clearAll() {
    this.dailyStats.clear();
    this.achievements.clear();
    this.currentStreak = 0;
    this.longestStreak = 0;
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(ACHIEVEMENTS_KEY),
    ]);
  }

  private async save() {
    try {
      const statsArray = Array.from(this.dailyStats.entries());
      const achievementsArray = Array.from(this.achievements.entries());

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(statsArray)),
        AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievementsArray)),
      ]);
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }
}

export const statisticsService = new StatisticsService();
