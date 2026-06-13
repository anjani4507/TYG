/**
 * Blind Synchronization
 * 
 * Collective team progress tracking without individual visibility
 */

import { EventEmitter } from 'eventemitter3';

export interface TeamProgress {
  teamId: string;
  totalFocusHours: number;
  memberCount: number;
  averageIntensity: number;
  milestones: TeamMilestone[];
  currentMilestone: number;
  progressPercentage: number;
  lastUpdated: number;
}

export interface TeamMilestone {
  id: string;
  name: string;
  targetHours: number;
  reward: string;
  achieved: boolean;
  achievedAt: number;
}

export interface BlindMemberProgress {
  memberId: string;
  sessionDuration: number;
  intensity: number;
  isActive: boolean;
  sessionStartTime: number;
}

/**
 * Blind Synchronization Service
 */
export class BlindSync extends EventEmitter {
  private teamProgress: Map<string, TeamProgress> = new Map();
  private memberProgress: Map<string, BlindMemberProgress> = new Map();
  private teamMembers: Map<string, string[]> = new Map(); // teamId -> memberIds

  constructor() {
    super();
  }

  /**
   * Create team
   */
  createTeam(teamId: string, memberIds: string[]): TeamProgress {
    const team: TeamProgress = {
      teamId,
      totalFocusHours: 0,
      memberCount: memberIds.length,
      averageIntensity: 0,
      milestones: this.generateDefaultMilestones(),
      currentMilestone: 0,
      progressPercentage: 0,
      lastUpdated: Date.now(),
    };

    this.teamProgress.set(teamId, team);
    this.teamMembers.set(teamId, memberIds);

    this.emit('team-created', team);
    return team;
  }

  /**
   * Generate default milestones
   */
  private generateDefaultMilestones(): TeamMilestone[] {
    return [
      {
        id: 'milestone-1',
        name: 'Team Warm-up',
        targetHours: 10,
        reward: '🔥 Fire Starter Badge',
        achieved: false,
        achievedAt: 0,
      },
      {
        id: 'milestone-2',
        name: 'Team Sprint',
        targetHours: 50,
        reward: '⚡ Sprint Master Badge',
        achieved: false,
        achievedAt: 0,
      },
      {
        id: 'milestone-3',
        name: 'Team Century',
        targetHours: 100,
        reward: '💯 Century Club Badge',
        achieved: false,
        achievedAt: 0,
      },
      {
        id: 'milestone-4',
        name: 'Team Legend',
        targetHours: 500,
        reward: '👑 Legend Status',
        achieved: false,
        achievedAt: 0,
      },
      {
        id: 'milestone-5',
        name: 'Team Unstoppable',
        targetHours: 1000,
        reward: '🚀 Unstoppable Force',
        achieved: false,
        achievedAt: 0,
      },
    ];
  }

  /**
   * Add member session to team progress
   */
  addMemberSession(
    teamId: string,
    memberId: string,
    sessionDuration: number,
    intensity: number
  ): TeamProgress | null {
    const team = this.teamProgress.get(teamId);
    if (!team) {
      console.warn(`Team ${teamId} not found`);
      return null;
    }

    // Convert session duration to hours
    const hours = sessionDuration / 3600;
    team.totalFocusHours += hours;

    // Update average intensity
    const totalIntensity = team.averageIntensity * (team.memberCount - 1) + intensity;
    team.averageIntensity = totalIntensity / team.memberCount;

    team.lastUpdated = Date.now();

    // Check for milestone achievements
    this.checkMilestones(teamId);

    // Update progress percentage
    const nextMilestone = team.milestones[team.currentMilestone];
    if (nextMilestone) {
      team.progressPercentage = Math.min(
        100,
        (team.totalFocusHours / nextMilestone.targetHours) * 100
      );
    }

    this.emit('member-session-added', {
      teamId,
      memberId,
      sessionDuration,
      intensity,
      teamProgress: team,
    });

    return team;
  }

  /**
   * Check for milestone achievements
   */
  private checkMilestones(teamId: string): void {
    const team = this.teamProgress.get(teamId);
    if (!team) return;

    for (let i = team.currentMilestone; i < team.milestones.length; i++) {
      const milestone = team.milestones[i];
      if (team.totalFocusHours >= milestone.targetHours && !milestone.achieved) {
        milestone.achieved = true;
        milestone.achievedAt = Date.now();
        team.currentMilestone = i + 1;

        this.emit('milestone-achieved', {
          teamId,
          milestone,
          totalHours: team.totalFocusHours,
        });

        // Update progress percentage for next milestone
        const nextMilestone = team.milestones[team.currentMilestone];
        if (nextMilestone) {
          team.progressPercentage = Math.min(
            100,
            (team.totalFocusHours / nextMilestone.targetHours) * 100
          );
        } else {
          team.progressPercentage = 100;
        }
      }
    }
  }

  /**
   * Get team progress (blind view - no individual member data)
   */
  getTeamProgress(teamId: string): TeamProgress | null {
    return this.teamProgress.get(teamId) || null;
  }

  /**
   * Get team progress bar data
   */
  getProgressBar(teamId: string): {
    current: number;
    target: number;
    percentage: number;
    milestone: string;
  } | null {
    const team = this.teamProgress.get(teamId);
    if (!team) return null;

    const nextMilestone = team.milestones[team.currentMilestone];
    if (!nextMilestone) {
      return {
        current: team.totalFocusHours,
        target: team.milestones[team.milestones.length - 1].targetHours,
        percentage: 100,
        milestone: 'All Milestones Achieved!',
      };
    }

    return {
      current: team.totalFocusHours,
      target: nextMilestone.targetHours,
      percentage: team.progressPercentage,
      milestone: nextMilestone.name,
    };
  }

  /**
   * Get achieved milestones
   */
  getAchievedMilestones(teamId: string): TeamMilestone[] {
    const team = this.teamProgress.get(teamId);
    if (!team) return [];

    return team.milestones.filter((m) => m.achieved);
  }

  /**
   * Get next milestone
   */
  getNextMilestone(teamId: string): TeamMilestone | null {
    const team = this.teamProgress.get(teamId);
    if (!team || team.currentMilestone >= team.milestones.length) {
      return null;
    }

    return team.milestones[team.currentMilestone];
  }

  /**
   * Get team statistics (aggregated, no individual data)
   */
  getTeamStats(teamId: string): {
    totalHours: number;
    averageIntensity: number;
    memberCount: number;
    achievedMilestones: number;
  } | null {
    const team = this.teamProgress.get(teamId);
    if (!team) return null;

    return {
      totalHours: Math.round(team.totalFocusHours * 10) / 10,
      averageIntensity: Math.round(team.averageIntensity),
      memberCount: team.memberCount,
      achievedMilestones: team.milestones.filter((m) => m.achieved).length,
    };
  }

  /**
   * Add team member
   */
  addTeamMember(teamId: string, memberId: string): void {
    const members = this.teamMembers.get(teamId);
    if (members && !members.includes(memberId)) {
      members.push(memberId);

      const team = this.teamProgress.get(teamId);
      if (team) {
        team.memberCount = members.length;
        this.emit('member-added', { teamId, memberId });
      }
    }
  }

  /**
   * Remove team member
   */
  removeTeamMember(teamId: string, memberId: string): void {
    const members = this.teamMembers.get(teamId);
    if (members) {
      const index = members.indexOf(memberId);
      if (index > -1) {
        members.splice(index, 1);

        const team = this.teamProgress.get(teamId);
        if (team) {
          team.memberCount = members.length;
          this.emit('member-removed', { teamId, memberId });
        }
      }
    }
  }

  /**
   * Get team members count
   */
  getTeamMemberCount(teamId: string): number {
    const members = this.teamMembers.get(teamId);
    return members ? members.length : 0;
  }

  /**
   * Reset team progress
   */
  resetTeamProgress(teamId: string): void {
    const team = this.teamProgress.get(teamId);
    if (team) {
      team.totalFocusHours = 0;
      team.averageIntensity = 0;
      team.currentMilestone = 0;
      team.progressPercentage = 0;
      team.milestones = this.generateDefaultMilestones();
      team.lastUpdated = Date.now();

      this.emit('team-reset', teamId);
    }
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton blind sync
 */
let globalBlindSync: BlindSync | null = null;

export function getGlobalBlindSync(): BlindSync {
  if (!globalBlindSync) {
    globalBlindSync = new BlindSync();
  }
  return globalBlindSync;
}

export function resetGlobalBlindSync(): void {
  if (globalBlindSync) {
    globalBlindSync.destroy();
    globalBlindSync = null;
  }
}
