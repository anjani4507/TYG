/**
 * Focus-Linked Reputation Tiers
 * 
 * Elite Squad system based on consistency and focus quality
 */

import { EventEmitter } from 'eventemitter3';

export type TierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Elite';

export interface Tier {
  name: TierName;
  level: number;
  minConsistencyScore: number;
  minIntensityScore: number;
  badge: string;
  color: string;
  benefits: string[];
  roomAccess: 'public' | 'tier-locked' | 'elite-only';
}

export interface UserReputation {
  userId: string;
  currentTier: TierName;
  consistencyScore: number;
  intensityScore: number;
  reputationPoints: number;
  streakDays: number;
  totalSessions: number;
  focusDebt: number;
  promotedAt: number;
  demotedAt: number;
}

/**
 * Tier Definitions
 */
const TIERS: Record<TierName, Tier> = {
  Bronze: {
    name: 'Bronze',
    level: 1,
    minConsistencyScore: 0,
    minIntensityScore: 0,
    badge: '🥉',
    color: '#CD7F32',
    benefits: ['Public room access', 'Basic leaderboard'],
    roomAccess: 'public',
  },
  Silver: {
    name: 'Silver',
    level: 2,
    minConsistencyScore: 200,
    minIntensityScore: 300,
    badge: '🥈',
    color: '#C0C0C0',
    benefits: ['Silver room access', 'Advanced leaderboard', 'Custom subjects'],
    roomAccess: 'tier-locked',
  },
  Gold: {
    name: 'Gold',
    level: 3,
    minConsistencyScore: 500,
    minIntensityScore: 600,
    badge: '🥇',
    color: '#FFD700',
    benefits: [
      'Gold room access',
      'Priority in sprints',
      'Distraction reports',
      'Custom themes',
    ],
    roomAccess: 'tier-locked',
  },
  Platinum: {
    name: 'Platinum',
    level: 4,
    minConsistencyScore: 1000,
    minIntensityScore: 1200,
    badge: '💎',
    color: '#E5E4E2',
    benefits: [
      'Platinum room access',
      'Sprint leadership',
      'AI coaching',
      'Priority support',
    ],
    roomAccess: 'tier-locked',
  },
  Diamond: {
    name: 'Diamond',
    level: 5,
    minConsistencyScore: 2000,
    minIntensityScore: 2500,
    badge: '💠',
    color: '#B9F2FF',
    benefits: [
      'Diamond room access',
      'Create private groups',
      'Advanced analytics',
      'Mentor status',
    ],
    roomAccess: 'elite-only',
  },
  Elite: {
    name: 'Elite',
    level: 6,
    minConsistencyScore: 5000,
    minIntensityScore: 6000,
    badge: '👑',
    color: '#FFD700',
    benefits: [
      'Elite room access',
      'Exclusive features',
      'Direct support',
      'Hall of fame',
    ],
    roomAccess: 'elite-only',
  },
};

/**
 * Reputation Tiers Service
 */
export class ReputationTiers extends EventEmitter {
  private userReputations: Map<string, UserReputation> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize user reputation
   */
  initializeUser(userId: string): UserReputation {
    const reputation: UserReputation = {
      userId,
      currentTier: 'Bronze',
      consistencyScore: 0,
      intensityScore: 0,
      reputationPoints: 0,
      streakDays: 0,
      totalSessions: 0,
      focusDebt: 0,
      promotedAt: 0,
      demotedAt: 0,
    };

    this.userReputations.set(userId, reputation);
    return reputation;
  }

  /**
   * Get user reputation
   */
  getUserReputation(userId: string): UserReputation {
    let reputation = this.userReputations.get(userId);
    if (!reputation) {
      reputation = this.initializeUser(userId);
    }
    return reputation;
  }

  /**
   * Update reputation scores
   */
  updateScores(
    userId: string,
    consistencyDelta: number,
    intensityDelta: number
  ): void {
    const reputation = this.getUserReputation(userId);

    reputation.consistencyScore = Math.max(
      0,
      reputation.consistencyScore + consistencyDelta
    );
    reputation.intensityScore = Math.max(
      0,
      reputation.intensityScore + intensityDelta
    );
    reputation.reputationPoints =
      reputation.consistencyScore * 0.4 + reputation.intensityScore * 0.6;

    // Check for tier promotion/demotion
    this.checkTierChange(userId);

    this.emit('reputation-updated', reputation);
  }

  /**
   * Add session
   */
  addSession(userId: string, intensity: number): void {
    const reputation = this.getUserReputation(userId);

    reputation.totalSessions += 1;
    reputation.streakDays = Math.min(365, reputation.streakDays + 1);

    // Consistency score: (currentStreak × 10) + (totalSessions × 2)
    reputation.consistencyScore =
      reputation.streakDays * 10 + reputation.totalSessions * 2;

    // Intensity score increases with high-intensity sessions
    if (intensity >= 80) {
      reputation.intensityScore += 50;
    } else if (intensity >= 60) {
      reputation.intensityScore += 30;
    } else if (intensity >= 40) {
      reputation.intensityScore += 15;
    }

    this.checkTierChange(userId);
    this.emit('session-added', { userId, intensity });
  }

  /**
   * Add focus debt
   */
  addFocusDebt(userId: string, amount: number): void {
    const reputation = this.getUserReputation(userId);
    reputation.focusDebt += amount;

    // If debt exceeds threshold, demote tier
    if (reputation.focusDebt > 500) {
      this.demoteTier(userId);
    }

    this.emit('focus-debt-added', { userId, amount });
  }

  /**
   * Pay off focus debt
   */
  payOffDebt(userId: string, amount: number): void {
    const reputation = this.getUserReputation(userId);
    reputation.focusDebt = Math.max(0, reputation.focusDebt - amount);

    // If debt is paid off, consider tier promotion
    if (reputation.focusDebt === 0) {
      this.checkTierChange(userId);
    }

    this.emit('debt-paid', { userId, amount });
  }

  /**
   * Check and update tier
   */
  private checkTierChange(userId: string): void {
    const reputation = this.getUserReputation(userId);
    const currentTier = TIERS[reputation.currentTier];

    // Don't demote if there's focus debt
    if (reputation.focusDebt > 0) {
      return;
    }

    // Check for promotion
    for (const tierName of ['Elite', 'Diamond', 'Platinum', 'Gold', 'Silver'] as TierName[]) {
      const tier = TIERS[tierName];
      if (
        reputation.consistencyScore >= tier.minConsistencyScore &&
        reputation.intensityScore >= tier.minIntensityScore &&
        currentTier.level < tier.level
      ) {
        this.promoteTier(userId, tierName);
        return;
      }
    }

    // Check for demotion
    if (
      reputation.consistencyScore < currentTier.minConsistencyScore ||
      reputation.intensityScore < currentTier.minIntensityScore
    ) {
      // Find appropriate tier for current scores
      for (const tierName of ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'] as TierName[]) {
        const tier = TIERS[tierName];
        if (
          reputation.consistencyScore >= tier.minConsistencyScore &&
          reputation.intensityScore >= tier.minIntensityScore
        ) {
          if (tier.level < currentTier.level) {
            this.demoteTier(userId, tierName);
          }
        }
      }
    }
  }

  /**
   * Promote tier
   */
  private promoteTier(userId: string, newTier: TierName): void {
    const reputation = this.getUserReputation(userId);
    const oldTier = reputation.currentTier;

    reputation.currentTier = newTier;
    reputation.promotedAt = Date.now();

    this.emit('tier-promoted', {
      userId,
      oldTier,
      newTier,
      tier: TIERS[newTier],
    });
  }

  /**
   * Demote tier
   */
  private demoteTier(userId: string, newTier?: TierName): void {
    const reputation = this.getUserReputation(userId);
    const oldTier = reputation.currentTier;

    if (!newTier) {
      // Find tier to demote to
      newTier = 'Bronze';
      for (const tierName of ['Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'] as TierName[]) {
        const tier = TIERS[tierName];
        if (
          reputation.consistencyScore >= tier.minConsistencyScore &&
          reputation.intensityScore >= tier.minIntensityScore
        ) {
          newTier = tierName;
        }
      }
    }

    reputation.currentTier = newTier;
    reputation.demotedAt = Date.now();

    this.emit('tier-demoted', {
      userId,
      oldTier,
      newTier,
      tier: TIERS[newTier],
    });
  }

  /**
   * Get tier info
   */
  getTierInfo(tierName: TierName): Tier {
    return TIERS[tierName];
  }

  /**
   * Get all tiers
   */
  getAllTiers(): Tier[] {
    return Object.values(TIERS);
  }

  /**
   * Check room access
   */
  canAccessRoom(userId: string, requiredAccess: string): boolean {
    const reputation = this.getUserReputation(userId);
    const tier = TIERS[reputation.currentTier];

    if (requiredAccess === 'public') return true;
    if (requiredAccess === 'tier-locked' && tier.roomAccess !== 'public')
      return true;
    if (requiredAccess === 'elite-only' && tier.roomAccess === 'elite-only')
      return true;

    return false;
  }

  /**
   * Get leaderboard by tier
   */
  getLeaderboardByTier(tierName: TierName, limit = 10): UserReputation[] {
    return Array.from(this.userReputations.values())
      .filter((rep) => rep.currentTier === tierName)
      .sort((a, b) => b.reputationPoints - a.reputationPoints)
      .slice(0, limit);
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton reputation tiers
 */
let globalReputationTiers: ReputationTiers | null = null;

export function getGlobalReputationTiers(): ReputationTiers {
  if (!globalReputationTiers) {
    globalReputationTiers = new ReputationTiers();
  }
  return globalReputationTiers;
}

export function resetGlobalReputationTiers(): void {
  if (globalReputationTiers) {
    globalReputationTiers.destroy();
    globalReputationTiers = null;
  }
}
