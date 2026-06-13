/**
 * Local Data Persistence Layer
 * 
 * Provides persistent storage for:
 * - Session data
 * - User preferences
 * - Sync queue
 * - Crash recovery
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersistedSession {
  id: string;
  userId: string;
  groupId?: string;
  subject?: string;
  duration: number;
  intensityScore: number;
  focusIntensity: number;
  distractionCount: number;
  startedAt: number; // timestamp
  endedAt?: number;
  status: 'active' | 'paused' | 'completed';
  metrics?: {
    activeScreenTime: number;
    backgroundTime: number;
    focusDuration: number;
  };
  review?: string;
  createdAt: number;
}

export interface CrashRecoveryData {
  activeSession?: PersistedSession;
  timestamp: number;
  appState: string;
}

/**
 * Local Persistence Service
 */
export class LocalPersistenceService {
  private readonly SESSION_PREFIX = 'session_';
  private readonly SESSIONS_INDEX = 'sessions_index';
  private readonly CRASH_RECOVERY_KEY = 'crash_recovery';
  private readonly USER_PREFS_KEY = 'user_preferences';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';

  /**
   * Save session to local storage
   */
  async saveSession(session: PersistedSession): Promise<void> {
    try {
      // Validate session
      if (!session || !session.id) {
        throw new Error('Invalid session: missing id');
      }
      if (session.duration < 0) {
        throw new Error('Invalid session: negative duration');
      }

      const key = `${this.SESSION_PREFIX}${session.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(session));

      // Update sessions index
      await this.addToSessionsIndex(session.id);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Get session from local storage
   */
  async getSession(sessionId: string): Promise<PersistedSession | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<PersistedSession[]> {
    try {
      const indexData = await AsyncStorage.getItem(this.SESSIONS_INDEX);
      if (!indexData) return [];

      let sessionIds: string[] = [];
      try {
        sessionIds = JSON.parse(indexData);
      } catch (parseError) {
        console.warn('Failed to parse sessions index, resetting:', parseError);
        await AsyncStorage.removeItem(this.SESSIONS_INDEX);
        return [];
      }

      if (!Array.isArray(sessionIds)) {
        console.warn('Invalid sessions index format, resetting');
        await AsyncStorage.removeItem(this.SESSIONS_INDEX);
        return [];
      }

      const sessions: PersistedSession[] = [];

      for (const id of sessionIds) {
        const session = await this.getSession(id);
        if (session) {
          sessions.push(session);
        }
      }

      // Sort by creation date (newest first)
      return sessions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to get all sessions:', error);
      return [];
    }
  }

  /**
   * Get completed sessions
   */
  async getCompletedSessions(limit: number = 50): Promise<PersistedSession[]> {
    try {
      const sessions = await this.getAllSessions();
      return sessions
        .filter((s) => s.status === 'completed')
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get completed sessions:', error);
      return [];
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await AsyncStorage.removeItem(key);
      await this.removeFromSessionsIndex(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Clear all sessions
   */
  async clearAllSessions(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.SESSIONS_INDEX);
      if (!indexData) return;

      const sessionIds: string[] = JSON.parse(indexData);
      const keys = sessionIds.map((id) => `${this.SESSION_PREFIX}${id}`);
      keys.push(this.SESSIONS_INDEX);

      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      throw error;
    }
  }

  /**
   * Save crash recovery data
   */
  async saveCrashRecoveryData(data: CrashRecoveryData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.CRASH_RECOVERY_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save crash recovery data:', error);
    }
  }

  /**
   * Get crash recovery data
   */
  async getCrashRecoveryData(): Promise<CrashRecoveryData | null> {
    try {
      const data = await AsyncStorage.getItem(this.CRASH_RECOVERY_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get crash recovery data:', error);
      return null;
    }
  }

  /**
   * Clear crash recovery data
   */
  async clearCrashRecoveryData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CRASH_RECOVERY_KEY);
    } catch (error) {
      console.error('Failed to clear crash recovery data:', error);
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(prefs: Record<string, any>): Promise<void> {
    try {
      const existing = await this.getUserPreferences();
      const merged = { ...existing, ...prefs };
      await AsyncStorage.setItem(
        this.USER_PREFS_KEY,
        JSON.stringify(merged)
      );
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(this.USER_PREFS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  /**
   * Add to sync queue
   */
  async addToSyncQueue(item: any): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalSessions: number;
    totalSize: number;
  }> {
    try {
      const sessions = await this.getAllSessions();
      const allKeys = await AsyncStorage.getAllKeys();
      const totalSize = allKeys.length * 1024;

      return {
        totalSessions: sessions.length,
        totalSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalSessions: 0, totalSize: 0 };
    }
  }

  /**
   * Private: Add session ID to index
   */
  private async addToSessionsIndex(sessionId: string): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.SESSIONS_INDEX);
      const sessionIds: string[] = indexData ? JSON.parse(indexData) : [];

      if (!sessionIds.includes(sessionId)) {
        sessionIds.push(sessionId);
        await AsyncStorage.setItem(
          this.SESSIONS_INDEX,
          JSON.stringify(sessionIds)
        );
      }
    } catch (error) {
      console.error('Failed to update sessions index:', error);
    }
  }

  /**
   * Private: Remove session ID from index
   */
  private async removeFromSessionsIndex(sessionId: string): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.SESSIONS_INDEX);
      if (!indexData) return;

      const sessionIds: string[] = JSON.parse(indexData);
      const filtered = sessionIds.filter((id) => id !== sessionId);

      await AsyncStorage.setItem(
        this.SESSIONS_INDEX,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Failed to update sessions index:', error);
    }
  }
}

/**
 * Singleton persistence service
 */
export const localPersistence = new LocalPersistenceService();
