/**
 * Database Service Layer
 * 
 * Routes data requests to appropriate backends:
 * - Presence (ephemeral) → Supabase Realtime
 * - Persistence (relational) → Neon Postgres via API
 * - Blobs (assets) → Supabase Storage
 */

import { supabase } from './supabase';

// Note: Prisma client will be initialized server-side only
// Client-side uses API endpoints for data access

/**
 * Data routing types
 */
export type DataType = 'presence' | 'persistence' | 'blob';

export interface DatabaseServiceConfig {
  enableCaching: boolean;
  cacheTTL: number; // in milliseconds
  enableOfflineSync: boolean;
}

/**
 * Database Service - Routes requests to appropriate backends
 */
export class DatabaseService {
  private config: DatabaseServiceConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: Partial<DatabaseServiceConfig> = {}) {
    this.config = {
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 60000, // 60 seconds default
      enableOfflineSync: config.enableOfflineSync ?? true,
    };
  }

  /**
   * PERSISTENCE LAYER: Neon Postgres via API
   */

  /**
   * Create a new session
   */
  async createSession(data: {
    userId: string;
    groupId?: string;
    subject?: string;
    description?: string;
    intensityScore?: number;
  }) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return await response.json();
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Get completed sessions with optimized partial index query
   */
  async getCompletedSessions(userId: string, limit: number = 50, offset: number = 0) {
    const cacheKey = `sessions:${userId}:${limit}:${offset}`;

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `/api/sessions?userId=${userId}&limit=${limit}&offset=${offset}&status=completed`
      );
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const sessions = await response.json();

      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: sessions,
          timestamp: Date.now(),
        });
      }

      return sessions;
    } catch (error) {
      console.error('Failed to fetch completed sessions:', error);
      throw error;
    }
  }

  /**
   * Get group sessions with optimized query
   */
  async getGroupSessions(groupId: string, limit: number = 100) {
    try {
      const response = await fetch(
        `/api/groups/${groupId}/sessions?limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch group sessions');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch group sessions:', error);
      throw error;
    }
  }

  /**
   * Update session with canvas snapshot URL
   */
  async updateSessionSnapshot(sessionId: string, canvasSnapshotUrl: string) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasSnapshotUrl }),
      });
      if (!response.ok) throw new Error('Failed to update session');
      return await response.json();
    } catch (error) {
      console.error('Failed to update session snapshot:', error);
      throw error;
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, intensityScore: number) {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intensityScore }),
      });
      if (!response.ok) throw new Error('Failed to end session');
      return await response.json();
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  }

  /**
   * Create a new group
   */
  async createGroup(data: {
    name: string;
    description?: string;
    creatorId: string;
  }) {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create group');
      return await response.json();
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  }

  /**
   * Get user's groups
   */
  async getUserGroups(userId: string) {
    try {
      const response = await fetch(`/api/users/${userId}/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user groups:', error);
      throw error;
    }
  }

  /**
   * PRESENCE LAYER: Supabase Realtime
   */

  /**
   * Broadcast presence to group
   */
  async broadcastPresence(
    groupId: string,
    userId: string,
    presence: {
      status: 'active' | 'idle' | 'offline';
      intensity?: number;
      sessionId?: string;
    }
  ) {
    try {
      const channel = supabase.channel(`presence:${groupId}`);
      await channel.track({
        user_id: userId,
        status: presence.status,
        intensity: presence.intensity,
        session_id: presence.sessionId,
        timestamp: Date.now(),
      });
      return true;
    } catch (error) {
      console.error('Failed to broadcast presence:', error);
      return false;
    }
  }

  /**
   * Subscribe to group presence updates
   */
  subscribeToGroupPresence(
    groupId: string,
    onPresenceChange: (presence: any[]) => void
  ) {
    const channel = supabase.channel(`presence:${groupId}`);

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presences = Object.values(state).flat();
      onPresenceChange(presences);
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  /**
   * BLOB STORAGE LAYER: Supabase Storage
   */

  /**
   * Upload canvas snapshot
   */
  async uploadCanvasSnapshot(
    sessionId: string,
    userId: string,
    canvasBlob: Blob
  ): Promise<string> {
    try {
      const fileName = `${userId}/${sessionId}-${Date.now()}.png`;

      const { data, error } = await supabase.storage
        .from('canvas-snapshots')
        .upload(fileName, canvasBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('canvas-snapshots')
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Failed to upload canvas snapshot:', error);
      throw error;
    }
  }

  /**
   * Get canvas snapshot URL
   */
  async getCanvasSnapshot(sessionId: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/snapshot`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.canvasSnapshotUrl || null;
    } catch (error) {
      console.error('Failed to get canvas snapshot:', error);
      return null;
    }
  }

}

// Export singleton instance
export const databaseService = new DatabaseService({
  enableCaching: true,
  cacheTTL: 60000,
  enableOfflineSync: true,
});
