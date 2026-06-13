/**
 * Leaderboard Service
 * 
 * Optimized ranking system based on:
 * - Consistency (streak-based)
 * - Intensity (average focus intensity)
 */

export type LeaderboardType = 'consistency' | 'intensity' | 'combined';
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export interface UserStats {
  userId: string;
  userName: string;
  avatar: string;
  totalSessions: number;
  totalFocusTime: number; // in seconds
  avgIntensity: number; // 0-1
  currentStreak: number; // consecutive days
  longestStreak: number;
  lastSessionDate: number; // timestamp
  badges: string[];
}

export interface LeaderboardEntry extends UserStats {
  rank: number;
  score: number;
  percentile: number;
}

export interface LeaderboardData {
  type: LeaderboardType;
  period: TimePeriod;
  entries: LeaderboardEntry[];
  generatedAt: number;
}

/**
 * Leaderboard Service
 */
export class LeaderboardService {
  /**
   * Calculate consistency score (streak-based)
   * 
   * Formula: (currentStreak * 10) + (longestStreak * 5) + (totalSessions * 2)
   */
  private calculateConsistencyScore(stats: UserStats): number {
    const streakBonus = stats.currentStreak * 10;
    const longestStreakBonus = stats.longestStreak * 5;
    const sessionBonus = Math.min(stats.totalSessions * 2, 100); // Cap at 100

    return streakBonus + longestStreakBonus + sessionBonus;
  }

  /**
   * Calculate intensity score
   * 
   * Formula: (avgIntensity * 100) + (totalFocusTime / 3600) * 10
   */
  private calculateIntensityScore(stats: UserStats): number {
    const intensityBase = stats.avgIntensity * 100;
    const focusTimeBonus = Math.min((stats.totalFocusTime / 3600) * 10, 100); // Cap at 100

    return intensityBase + focusTimeBonus;
  }

  /**
   * Calculate combined score (weighted average)
   * 
   * Formula: (consistency * 0.4) + (intensity * 0.6)
   */
  private calculateCombinedScore(stats: UserStats): number {
    const consistencyScore = this.calculateConsistencyScore(stats);
    const intensityScore = this.calculateIntensityScore(stats);

    // Normalize scores to 0-100 range
    const normalizedConsistency = Math.min(consistencyScore / 2, 100);
    const normalizedIntensity = Math.min(intensityScore, 100);

    return normalizedConsistency * 0.4 + normalizedIntensity * 0.6;
  }

  /**
   * Generate leaderboard
   */
  generateLeaderboard(
    userStats: UserStats[],
    type: LeaderboardType = 'combined',
    limit: number = 100
  ): LeaderboardData {
    // Validate input
    if (!Array.isArray(userStats)) {
      console.warn('Invalid userStats: not an array');
      return {
        type,
        period: 'all-time',
        entries: [],
        generatedAt: Date.now(),
      };
    }

    if (userStats.length === 0) {
      return {
        type,
        period: 'all-time',
        entries: [],
        generatedAt: Date.now(),
      };
    }

    if (limit < 1) {
      limit = 10;
    }

    // Calculate scores based on type
    const scoredUsers = userStats.map((stats) => {
      let score = 0;

      switch (type) {
        case 'consistency':
          score = this.calculateConsistencyScore(stats);
          break;
        case 'intensity':
          score = this.calculateIntensityScore(stats);
          break;
        case 'combined':
          score = this.calculateCombinedScore(stats);
          break;
      }

      return { ...stats, score };
    });

    // Sort by score (descending)
    const sorted = scoredUsers.sort((a, b) => b.score - a.score);

    // Calculate percentiles
    const entries: LeaderboardEntry[] = sorted.slice(0, limit).map((user, index) => {
      const percentile = ((sorted.length - index) / sorted.length) * 100;

      return {
        ...user,
        rank: index + 1,
        score: user.score,
        percentile,
      };
    });

    return {
      type,
      period: 'all-time',
      entries,
      generatedAt: Date.now(),
    };
  }

  /**
   * Get user rank
   */
  getUserRank(
    userId: string,
    userStats: UserStats[],
    type: LeaderboardType = 'combined'
  ): LeaderboardEntry | null {
    if (!userId || userId.trim().length === 0) {
      console.warn('Invalid userId');
      return null;
    }

    const leaderboard = this.generateLeaderboard(userStats, type);
    const entry = leaderboard.entries.find((entry) => entry.userId === userId) || null;
    return entry;
  }

  /**
   * Get top users
   */
  getTopUsers(
    userStats: UserStats[],
    type: LeaderboardType = 'combined',
    limit: number = 10
  ): LeaderboardEntry[] {
    const leaderboard = this.generateLeaderboard(userStats, type, limit);
    return leaderboard.entries;
  }

  /**
   * Get users around a specific user
   */
  getUserContext(
    userId: string,
    userStats: UserStats[],
    type: LeaderboardType = 'combined',
    contextSize: number = 5
  ): LeaderboardEntry[] {
    if (!userId || userId.trim().length === 0) {
      console.warn('Invalid userId');
      return [];
    }

    if (contextSize < 1) {
      contextSize = 5;
    }

    const leaderboard = this.generateLeaderboard(userStats, type);
    const userRank = leaderboard.entries.findIndex((entry) => entry.userId === userId);

    if (userRank === -1) {
      return [];
    }

    const start = Math.max(0, userRank - contextSize);
    const end = Math.min(leaderboard.entries.length, userRank + contextSize + 1);

    return leaderboard.entries.slice(start, end);
  }

  /**
   * Get badges for user
   */
  calculateBadges(stats: UserStats): string[] {
    const badges: string[] = [];

    // Consistency badges
    if (stats.currentStreak >= 7) badges.push('🔥 7-Day Streak');
    if (stats.currentStreak >= 30) badges.push('🌟 30-Day Streak');
    if (stats.longestStreak >= 100) badges.push('💎 Century Streak');

    // Intensity badges
    if (stats.avgIntensity >= 0.9) badges.push('⚡ Intense Focuser');
    if (stats.avgIntensity >= 0.95) badges.push('🎯 Perfect Focus');

    // Volume badges
    if (stats.totalSessions >= 100) badges.push('📚 Century Sessions');
    if (stats.totalFocusTime >= 360000) badges.push('⏱️ 100-Hour Club'); // 100 hours

    // Consistency badges
    if (stats.totalSessions > 0 && stats.currentStreak === stats.totalSessions) {
      badges.push('✅ Perfect Consistency');
    }

    return badges;
  }

  /**
   * Get leaderboard stats
   */
  getLeaderboardStats(userStats: UserStats[]): {
    totalUsers: number;
    avgIntensity: number;
    avgStreak: number;
    totalFocusTime: number;
  } {
    if (userStats.length === 0) {
      return {
        totalUsers: 0,
        avgIntensity: 0,
        avgStreak: 0,
        totalFocusTime: 0,
      };
    }

    const avgIntensity =
      userStats.reduce((sum, s) => sum + s.avgIntensity, 0) / userStats.length;
    const avgStreak =
      userStats.reduce((sum, s) => sum + s.currentStreak, 0) / userStats.length;
    const totalFocusTime = userStats.reduce((sum, s) => sum + s.totalFocusTime, 0);

    return {
      totalUsers: userStats.length,
      avgIntensity,
      avgStreak,
      totalFocusTime,
    };
  }

  /**
   * Filter leaderboard by time period (mock implementation)
   */
  filterByTimePeriod(
    userStats: UserStats[],
    period: TimePeriod
  ): UserStats[] {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    let cutoffTime = 0;

    switch (period) {
      case 'daily':
        cutoffTime = now - dayInMs;
        break;
      case 'weekly':
        cutoffTime = now - dayInMs * 7;
        break;
      case 'monthly':
        cutoffTime = now - dayInMs * 30;
        break;
      case 'all-time':
        cutoffTime = 0;
        break;
    }

    return userStats.filter((stats) => stats.lastSessionDate >= cutoffTime);
  }
}

/**
 * Singleton leaderboard service
 */
export const leaderboardService = new LeaderboardService();
