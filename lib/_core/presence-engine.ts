import { supabase } from './supabase';
import { usePresenceStore, type PresenceStatus } from '@/lib/stores/presence-store';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Presence Engine - Manages real-time user presence in groups
 * Broadcasts user status (active, idle, offline) to group members
 */

let presenceSubscription: any = null;
let appStateSubscription: any = null;
let presenceUpdateInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize presence tracking for a specific group
 */
export const initializeGroupPresence = async (groupId: string, userId: string) => {
  try {
    // Subscribe to presence updates for this group
    const channel = supabase.channel(`presence:${groupId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: userId },
      },
    });

    // Listen for presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceStore = usePresenceStore.getState();

      // Update store with all members' presence
      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const presence = presences[0]; // Get latest presence
          presenceStore.updateUserPresence(groupId, presence.user_id, {
            userId: presence.user_id,
            userName: presence.user_name,
            status: presence.status as PresenceStatus,
            intensity: presence.intensity,
            currentSessionId: presence.session_id,
          });
        }
      });
    });

    // Listen for join events
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      const presenceStore = usePresenceStore.getState();
      newPresences.forEach((presence: any) => {
        presenceStore.updateUserPresence(groupId, presence.user_id, {
          userId: presence.user_id,
          userName: presence.user_name,
          status: presence.status as PresenceStatus,
          intensity: presence.intensity,
          currentSessionId: presence.session_id,
        });
      });
    });

    // Listen for leave events
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      const presenceStore = usePresenceStore.getState();
      leftPresences.forEach((presence: any) => {
        presenceStore.removeUserPresence(groupId, presence.user_id);
      });
    });

    // Subscribe to the channel
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Broadcast initial presence
        await broadcastPresence(channel, groupId, userId, 'active');
      }
    });

    presenceSubscription = channel;

    // Setup app state listener for presence updates
    setupAppStateListener(channel, groupId, userId);

    // Setup periodic presence updates
    setupPresenceHeartbeat(channel, groupId, userId);
  } catch (error) {
    console.error('Failed to initialize group presence:', error);
  }
};

/**
 * Broadcast user presence to the group
 */
export const broadcastPresence = async (
  channel: any,
  groupId: string,
  userId: string,
  status: PresenceStatus,
  intensity?: number,
  sessionId?: string
) => {
  try {
    await channel.track({
      user_id: userId,
      user_name: 'User', // Should be fetched from auth store
      status,
      intensity,
      session_id: sessionId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Failed to broadcast presence:', error);
  }
};

/**
 * Setup app state listener to update presence when app goes to background
 */
const setupAppStateListener = (channel: any, groupId: string, userId: string) => {
  try {
    appStateSubscription = AppState.addEventListener('change', async (state: AppStateStatus) => {
      try {
        if (state === 'background') {
          // User went to background - mark as idle
          await broadcastPresence(channel, groupId, userId, 'idle');
        } else if (state === 'active') {
          // User came back to foreground - mark as active
          await broadcastPresence(channel, groupId, userId, 'active');
        }
      } catch (error) {
        console.warn('Failed to broadcast presence on app state change:', error);
      }
    });
  } catch (error) {
    console.warn('Failed to setup app state listener:', error);
  }
};

/**
 * Setup periodic presence heartbeat to keep user marked as active
 */
const setupPresenceHeartbeat = (channel: any, groupId: string, userId: string) => {
  try {
    // Send presence update every 30 seconds to keep connection alive
    presenceUpdateInterval = setInterval(async () => {
      try {
        await broadcastPresence(channel, groupId, userId, 'active');
      } catch (error) {
        console.warn('Failed to send presence heartbeat:', error);
      }
    }, 30000);
  } catch (error) {
    console.warn('Failed to setup presence heartbeat:', error);
  }
};

/**
 * Cleanup presence tracking
 */
export const cleanupPresence = async () => {
  try {
    if (presenceSubscription) {
      try {
        await presenceSubscription.unsubscribe();
      } catch (error) {
        console.warn('Failed to unsubscribe from presence channel:', error);
      }
      presenceSubscription = null;
    }

    if (appStateSubscription) {
      try {
        appStateSubscription.remove();
      } catch (error) {
        console.warn('Failed to remove app state subscription:', error);
      }
      appStateSubscription = null;
    }

    if (presenceUpdateInterval) {
      clearInterval(presenceUpdateInterval);
      presenceUpdateInterval = null;
    }

    // Clear presence store
    const presenceStore = usePresenceStore.getState();
    if (presenceStore && presenceStore.groupPresences) {
      presenceStore.groupPresences = {};
    }
  } catch (error) {
    console.error('Failed to cleanup presence:', error);
  }
};

/**
 * Update user intensity during active session
 */
export const updateSessionIntensity = async (
  channel: any,
  groupId: string,
  userId: string,
  intensity: number,
  sessionId: string
) => {
  try {
    await broadcastPresence(channel, groupId, userId, 'active', intensity, sessionId);
  } catch (error) {
    console.error('Failed to update session intensity:', error);
  }
};

/**
 * Mark user as offline when session ends
 */
export const markUserOffline = async (channel: any, groupId: string, userId: string) => {
  try {
    await broadcastPresence(channel, groupId, userId, 'offline');
  } catch (error) {
    console.error('Failed to mark user offline:', error);
  }
};
