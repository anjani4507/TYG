/**
 * Notification Service
 * 
 * Comprehensive push notifications for sprint alerts, tier promotions, and reminders
 */

import * as Notifications from 'expo-notifications';
import { EventEmitter } from 'eventemitter3';
import { Platform } from 'react-native';

export type NotificationType =
  | 'sprint-alert'
  | 'tier-promotion'
  | 'tier-demotion'
  | 'focus-debt-warning'
  | 'accountability-reminder'
  | 'milestone-achieved'
  | 'streak-milestone'
  | 'daily-summary'
  | 'team-invite'
  | 'session-complete';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  priority?: 'default' | 'high';
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  scheduledTime: number;
  isRecurring: boolean;
  recurringDays?: number[];
  isActive: boolean;
}

export interface NotificationPreferences {
  userId: string;
  sprintAlerts: boolean;
  tierNotifications: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:mm format
  focusDebtWarnings: boolean;
  milestoneNotifications: boolean;
  teamNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

/**
 * Notification Service
 */
export class NotificationService extends EventEmitter {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private notificationListener: any = null;
  private responseListener: any = null;

  constructor() {
    super();
    this.initializeNotifications();
  }

  /**
   * Initialize notification handlers
   */
  private async initializeNotifications(): Promise<void> {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        this.emit('notification-received', notification);
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });

    // Listen for notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        this.emit('notification-received', notification);
      }
    );

    // Listen for notification responses
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.emit('notification-response', response);
      }
    );

    // Request permissions on iOS
    if (Platform.OS === 'ios') {
      await this.requestPermissions();
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Send immediate notification
   */
  async sendNotification(payload: NotificationPayload): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          badge: payload.badge,
          sound: payload.sound || 'default',
          priority: payload.priority || 'default',
        },
        trigger: null, // Send immediately
      });

      this.emit('notification-sent', { id: notificationId, payload });
      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  /**
   * Schedule notification for later
   */
  async scheduleNotification(
    payload: NotificationPayload,
    delaySeconds: number,
    isRecurring = false,
    recurringDays?: number[]
  ): Promise<string | null> {
    try {
      const notificationId = `notif-${Date.now()}`;

      if (isRecurring && recurringDays && recurringDays.length > 0) {
        // Schedule recurring notification
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (const day of recurringDays) {
          const scheduleDate = new Date(tomorrow);
          scheduleDate.setDate(scheduleDate.getDate() + day);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: payload.title,
              body: payload.body,
              data: payload.data || {},
            },
            trigger: {
              type: 'daily' as any,
              hour: scheduleDate.getHours(),
              minute: scheduleDate.getMinutes(),
            },
          });
        }
      } else {
        // Schedule one-time notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
          },
          trigger: {
            type: 'time-interval' as any,
            seconds: delaySeconds,
          },
        });
      }

      const scheduled: ScheduledNotification = {
        id: notificationId,
        type: payload.type,
        payload,
        scheduledTime: Date.now() + delaySeconds * 1000,
        isRecurring,
        recurringDays,
        isActive: true,
      };

      this.scheduledNotifications.set(notificationId, scheduled);
      this.emit('notification-scheduled', scheduled);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Send sprint alert
   */
  async sendSprintAlert(sprintName: string, startTime: number): Promise<string | null> {
    const delaySeconds = Math.max(0, Math.floor((startTime - Date.now()) / 1000));

    return this.scheduleNotification(
      {
        type: 'sprint-alert',
        title: '🏃 Sprint Starting!',
        body: `"${sprintName}" sprint starts in 5 minutes. Get ready to focus!`,
        data: { sprintName, startTime },
        priority: 'high',
      },
      delaySeconds
    );
  }

  /**
   * Send tier promotion notification
   */
  async sendTierPromotion(
    userId: string,
    oldTier: string,
    newTier: string,
    badge: string
  ): Promise<string | null> {
    return this.sendNotification({
      type: 'tier-promotion',
      title: `🎉 Tier Promotion!`,
      body: `Congratulations! You've been promoted from ${oldTier} to ${newTier} ${badge}`,
      data: { userId, oldTier, newTier },
      priority: 'high',
      badge: 1,
    });
  }

  /**
   * Send tier demotion notification
   */
  async sendTierDemotion(
    userId: string,
    oldTier: string,
    newTier: string
  ): Promise<string | null> {
    return this.sendNotification({
      type: 'tier-demotion',
      title: '⚠️ Tier Demotion',
      body: `Your tier has changed from ${oldTier} to ${newTier}. Keep up the focus!`,
      data: { userId, oldTier, newTier },
      priority: 'default',
    });
  }

  /**
   * Send focus debt warning
   */
  async sendFocusDebtWarning(
    userId: string,
    debtAmount: number
  ): Promise<string | null> {
    return this.sendNotification({
      type: 'focus-debt-warning',
      title: '⚡ Focus Debt Alert',
      body: `You have ${debtAmount} focus debt. Complete a recovery session to clear it!`,
      data: { userId, debtAmount },
      priority: 'high',
    });
  }

  /**
   * Send daily accountability reminder
   */
  async sendDailyReminder(userId: string, streakDays: number): Promise<string | null> {
    const preferences = this.preferences.get(userId);
    if (!preferences || !preferences.dailyReminder) {
      return null;
    }

    const messages = [
      `Your ${streakDays}-day streak is waiting! Start a session today.`,
      `Don't break the chain! ${streakDays} days strong. Keep going!`,
      `Time to focus! Your streak is at ${streakDays} days.`,
      `Your team is counting on you. Start studying now!`,
      `${streakDays} days of focus. Let's make it ${streakDays + 1}!`,
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    return this.sendNotification({
      type: 'accountability-reminder',
      title: '📚 Daily Focus Reminder',
      body: message,
      data: { userId, streakDays },
      priority: 'default',
    });
  }

  /**
   * Send milestone achieved notification
   */
  async sendMilestoneAchieved(
    teamId: string,
    milestoneName: string,
    reward: string
  ): Promise<string | null> {
    return this.sendNotification({
      type: 'milestone-achieved',
      title: '🏆 Team Milestone!',
      body: `Your team achieved "${milestoneName}"! Reward: ${reward}`,
      data: { teamId, milestoneName, reward },
      priority: 'high',
      badge: 1,
    });
  }

  /**
   * Send streak milestone notification
   */
  async sendStreakMilestone(
    userId: string,
    streakDays: number
  ): Promise<string | null> {
    let emoji = '🔥';
    let title = 'Streak Milestone!';

    if (streakDays === 7) {
      emoji = '🔥';
      title = 'Week Warrior!';
    } else if (streakDays === 30) {
      emoji = '💪';
      title = 'Month Master!';
    } else if (streakDays === 100) {
      emoji = '👑';
      title = 'Century Champion!';
    }

    return this.sendNotification({
      type: 'streak-milestone',
      title: `${emoji} ${title}`,
      body: `You've maintained a ${streakDays}-day focus streak!`,
      data: { userId, streakDays },
      priority: 'high',
      badge: 1,
    });
  }

  /**
   * Send daily summary notification
   */
  async sendDailySummary(
    userId: string,
    totalFocusTime: number,
    sessionsCompleted: number,
    averageIntensity: number
  ): Promise<string | null> {
    const hours = Math.floor(totalFocusTime / 3600);
    const minutes = Math.floor((totalFocusTime % 3600) / 60);

    return this.sendNotification({
      type: 'daily-summary',
      title: '📊 Daily Summary',
      body: `${hours}h ${minutes}m focus | ${sessionsCompleted} sessions | ${averageIntensity}% intensity`,
      data: { userId, totalFocusTime, sessionsCompleted, averageIntensity },
      priority: 'default',
    });
  }

  /**
   * Send team invite notification
   */
  async sendTeamInvite(
    userId: string,
    teamName: string,
    invitedBy: string
  ): Promise<string | null> {
    return this.sendNotification({
      type: 'team-invite',
      title: '👥 Team Invite!',
      body: `${invitedBy} invited you to join "${teamName}"`,
      data: { userId, teamName, invitedBy },
      priority: 'high',
      badge: 1,
    });
  }

  /**
   * Send session complete notification
   */
  async sendSessionComplete(
    userId: string,
    duration: number,
    intensity: number
  ): Promise<string | null> {
    const minutes = Math.floor(duration / 60);

    return this.sendNotification({
      type: 'session-complete',
      title: '✅ Session Complete!',
      body: `Great work! ${minutes}min session at ${intensity}% intensity.`,
      data: { userId, duration, intensity },
      priority: 'default',
    });
  }

  /**
   * Initialize user preferences
   */
  initializePreferences(userId: string): NotificationPreferences {
    const preferences: NotificationPreferences = {
      userId,
      sprintAlerts: true,
      tierNotifications: true,
      dailyReminder: true,
      dailyReminderTime: '08:00',
      focusDebtWarnings: true,
      milestoneNotifications: true,
      teamNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };

    this.preferences.set(userId, preferences);
    return preferences;
  }

  /**
   * Get user preferences
   */
  getPreferences(userId: string): NotificationPreferences {
    let preferences = this.preferences.get(userId);
    if (!preferences) {
      preferences = this.initializePreferences(userId);
    }
    return preferences;
  }

  /**
   * Update user preferences
   */
  updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const preferences = this.getPreferences(userId);
    const updated = { ...preferences, ...updates };
    this.preferences.set(userId, updated);
    this.emit('preferences-updated', updated);
    return updated;
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications.delete(notificationId);
      this.emit('notification-cancelled', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      this.emit('all-notifications-cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * Destroy service
   */
  destroy(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.removeAllListeners();
  }
}

/**
 * Singleton notification service
 */
let globalNotificationService: NotificationService | null = null;

export function getGlobalNotificationService(): NotificationService {
  if (!globalNotificationService) {
    globalNotificationService = new NotificationService();
  }
  return globalNotificationService;
}

export function resetGlobalNotificationService(): void {
  if (globalNotificationService) {
    globalNotificationService.destroy();
    globalNotificationService = null;
  }
}
