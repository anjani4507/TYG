/**
 * Notification Integration
 * 
 * Connect notification service with all core services
 */

import { getGlobalNotificationService } from './notification-service';
import { getGlobalReputationTiers } from './reputation-tiers';
import { getGlobalBlindSync } from './blind-sync';

/**
 * Initialize notification integrations
 */
export function initializeNotificationIntegrations(): void {
  const notificationService = getGlobalNotificationService();
  const reputationTiers = getGlobalReputationTiers();
  const blindSync = getGlobalBlindSync();

  // Tier promotion notifications
  reputationTiers.on('tier-promoted', async (event: any) => {
    const { userId, newTier, tier } = event;
    const prefs = notificationService.getPreferences(userId);

    if (prefs.tierNotifications) {
      await notificationService.sendTierPromotion(
        userId,
        event.oldTier,
        newTier,
        tier.badge
      );
    }
  });

  // Tier demotion notifications
  reputationTiers.on('tier-demoted', async (event) => {
    const { userId, newTier } = event;
    const prefs = notificationService.getPreferences(userId);

    if (prefs.tierNotifications) {
      await notificationService.sendTierDemotion(userId, event.oldTier, newTier);
    }
  });

  // Team milestone achievements
  blindSync.on('milestone-achieved', async (event: any) => {
    const { teamId, milestone } = event;
    // Send to all team members
    await notificationService.sendMilestoneAchieved(
      teamId,
      milestone.name,
      milestone.reward
    );
  });

  // Streak milestones
  reputationTiers.on('streak-milestone', async (event) => {
    const { userId, streakDays } = event;
    const prefs = notificationService.getPreferences(userId);

    if (prefs.milestoneNotifications) {
      await notificationService.sendStreakMilestone(userId, streakDays);
    }
  });
}

/**
 * Schedule daily reminders for user
 */
export async function scheduleDailyReminders(userId: string): Promise<void> {
  const notificationService = getGlobalNotificationService();
  const reputationTiers = getGlobalReputationTiers();

  const prefs = notificationService.getPreferences(userId);
  if (!prefs.dailyReminder) return;

  const reputation = reputationTiers.getUserReputation(userId);
  const [hours, minutes] = prefs.dailyReminderTime.split(':').map(Number);

  // Calculate delay to next scheduled time
  const now = new Date();
  const nextReminder = new Date(now);
  nextReminder.setHours(hours, minutes, 0, 0);

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1);
  }

  const delaySeconds = Math.floor((nextReminder.getTime() - now.getTime()) / 1000);

  await notificationService.scheduleNotification(
    {
      type: 'accountability-reminder',
      title: '📚 Daily Focus Reminder',
      body: `Your ${reputation.streakDays}-day streak is waiting! Start a session today.`,
      data: { userId, streakDays: reputation.streakDays },
      priority: 'default',
    },
    Math.max(0, delaySeconds),
    true, // recurring
    [0] // every day
  );
}

/**
 * Send daily summary
 */
export async function sendDailySummary(
  userId: string,
  totalFocusTime: number,
  sessionsCompleted: number,
  averageIntensity: number
): Promise<void> {
  const notificationService = getGlobalNotificationService();
  const prefs = notificationService.getPreferences(userId);

  if (prefs.dailyReminder) {
    await notificationService.sendDailySummary(
      userId,
      totalFocusTime,
      sessionsCompleted,
      averageIntensity
    );
  }
}

/**
 * Send session complete notification
 */
export async function notifySessionComplete(
  userId: string,
  duration: number,
  intensity: number
): Promise<void> {
  const notificationService = getGlobalNotificationService();
  await notificationService.sendSessionComplete(userId, duration, intensity);
}

/**
 * Send team invite notification
 */
export async function notifyTeamInvite(
  userId: string,
  teamName: string,
  invitedBy: string
): Promise<void> {
  const notificationService = getGlobalNotificationService();
  const prefs = notificationService.getPreferences(userId);

  if (prefs.teamNotifications) {
    await notificationService.sendTeamInvite(userId, teamName, invitedBy);
  }
}

/**
 * Cleanup notification integrations
 */
export function cleanupNotificationIntegrations(): void {
  const reputationTiers = getGlobalReputationTiers();
  const blindSync = getGlobalBlindSync();

  reputationTiers.removeAllListeners();
  blindSync.removeAllListeners();
}
