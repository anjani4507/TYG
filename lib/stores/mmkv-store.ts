/**
 * MMKV Local Hydration Store
 * 
 * Implements fast-reload strategy:
 * 1. Load last known state from MMKV (instant)
 * 2. Concurrently fetch incremental updates from Neon via Prisma
 * 3. Merge updates with conflict resolution
 * 4. Sync offline changes when online
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Initialize MMKV storage (lazy load to avoid issues on web)
let mmkvStorage: any = null;

const getMMKVStorage = () => {
  if (!mmkvStorage) {
    try {
      const { MMKV } = require('react-native-mmkv');
      mmkvStorage = new MMKV({
        id: 'flowfocus-app',
      });
    } catch (error) {
      console.warn('MMKV not available, using memory storage');
      // Fallback to memory storage
      mmkvStorage = {
        getString: () => null,
        setString: () => {},
        getNumber: () => 0,
        setNumber: () => {},
        delete: () => {},
      };
    }
  }
  return mmkvStorage;
}

/**
 * Custom Zustand storage adapter for MMKV
 */
const mmkvZustandStorage = createJSONStorage(() => {
  const storage = getMMKVStorage();
  return {
    getItem: (name: string) => {
      const value = storage.getString(name);
      return value ? JSON.parse(value) : null;
    },
    setItem: (name: string, value: any) => {
      storage.setString(name, JSON.stringify(value));
    },
    removeItem: (name: string) => {
      storage.delete(name);
    },
  };
});

/**
 * Local session cache
 */
export interface CachedSession {
  id: string;
  userId: string;
  groupId?: string;
  subject?: string;
  duration: number;
  intensityScore: number;
  status: 'active' | 'paused' | 'completed';
  startedAt: number; // timestamp
  endedAt?: number;
  canvasSnapshotUrl?: string;
  lastSyncedAt: number; // timestamp of last sync with server
}

/**
 * Local group cache
 */
export interface CachedGroup {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  memberCount: number;
  lastSyncedAt: number;
}

/**
 * Sync queue for offline changes
 */
export interface SyncQueueItem {
  id: string;
  type: 'session' | 'presence' | 'group';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * MMKV Store for local hydration
 */
interface MMKVStoreState {
  // Local cache
  sessionCache: Map<string, CachedSession>;
  groupCache: Map<string, CachedGroup>;
  syncQueue: SyncQueueItem[];
  lastSyncTime: number;
  isOnline: boolean;

  // Actions
  loadFromMMKV: () => Promise<void>;
  saveSessionToCache: (session: CachedSession) => void;
  saveGroupToCache: (group: CachedGroup) => void;
  addToSyncQueue: (item: SyncQueueItem) => void;
  clearSyncQueue: () => void;
  getSyncQueueItems: () => SyncQueueItem[];
  setOnlineStatus: (isOnline: boolean) => void;
  updateLastSyncTime: () => void;
  clearCache: () => void;
}

export const useMMKVStore = create<MMKVStoreState>()(
  persist(
    (set, get) => ({
      sessionCache: new Map(),
      groupCache: new Map(),
      syncQueue: [],
      lastSyncTime: 0,
      isOnline: true,

      loadFromMMKV: async () => {
        try {
          const storage = getMMKVStorage();
          // Load sessions
          const sessionsData = storage.getString('sessions_cache');
          if (sessionsData) {
            const sessions = JSON.parse(sessionsData);
            const sessionMap = new Map<string, CachedSession>(
              sessions.map((s: CachedSession) => [s.id, s])
            );
            set({ sessionCache: sessionMap });
          }

          // Load groups
          const groupsData = storage.getString('groups_cache');
          if (groupsData) {
            const groups = JSON.parse(groupsData);
            const groupMap = new Map<string, CachedGroup>(
              groups.map((g: CachedGroup) => [g.id, g])
            );
            set({ groupCache: groupMap });
          }

          // Load sync queue
          const queueData = storage.getString('sync_queue');
          if (queueData) {
            const queue = JSON.parse(queueData);
            set({ syncQueue: queue });
          }

          // Load last sync time
          const lastSync = storage.getNumber('last_sync_time') || 0;
          set({ lastSyncTime: lastSync });
        } catch (error) {
          console.error('Failed to load from MMKV:', error);
        }
      },

      saveSessionToCache: (session: CachedSession) => {
        const { sessionCache } = get();
        const updated = new Map(sessionCache);
        updated.set(session.id, session);
        set({ sessionCache: updated });

        // Persist to MMKV
        const sessions = Array.from(updated.values());
        getMMKVStorage().setString('sessions_cache', JSON.stringify(sessions));
      },

      saveGroupToCache: (group: CachedGroup) => {
        const { groupCache } = get();
        const updated = new Map(groupCache);
        updated.set(group.id, group);
        set({ groupCache: updated });

        // Persist to MMKV
        const groups = Array.from(updated.values());
        getMMKVStorage().setString('groups_cache', JSON.stringify(groups));
      },

      addToSyncQueue: (item: SyncQueueItem) => {
        const { syncQueue } = get();
        const updated = [...syncQueue, item];
        set({ syncQueue: updated });

        // Persist to MMKV
        getMMKVStorage().setString('sync_queue', JSON.stringify(updated));
      },

      clearSyncQueue: () => {
        set({ syncQueue: [] });
        getMMKVStorage().delete('sync_queue');
      },

      getSyncQueueItems: () => {
        return get().syncQueue;
      },

      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
      },

      updateLastSyncTime: () => {
        const now = Date.now();
        set({ lastSyncTime: now });
        getMMKVStorage().setNumber('last_sync_time', now);
      },

      clearCache: () => {
        set({
          sessionCache: new Map(),
          groupCache: new Map(),
          syncQueue: [],
          lastSyncTime: 0,
        });
        const storage = getMMKVStorage();
        storage.delete('sessions_cache');
        storage.delete('groups_cache');
        storage.delete('sync_queue');
        storage.delete('last_sync_time');
      },
    }),
    {
      name: 'mmkv-store',
      storage: mmkvZustandStorage,
    }
  )
);

/**
 * Hydration hook - Load local state on app startup
 */
export const useHydration = () => {
  const loadFromMMKV = useMMKVStore((state) => state.loadFromMMKV);

  return {
    hydrate: async () => {
      await loadFromMMKV();
    },
  };
};

/**
 * Sync manager - Handle incremental updates from Neon
 */
export class IncrementalSyncManager {
  private lastSyncTimestamp: number = 0;

  /**
   * Fetch incremental updates from server
   */
  async fetchIncrementalUpdates(userId: string) {
    try {
      // This would call your API endpoint that returns only changes since lastSyncTimestamp
      const response = await fetch('/api/sync/incremental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          since: this.lastSyncTimestamp,
        }),
      });

      if (!response.ok) throw new Error('Sync failed');

      const updates = await response.json();
      this.lastSyncTimestamp = Date.now();

      return updates;
    } catch (error) {
      console.error('Failed to fetch incremental updates:', error);
      return null;
    }
  }

  /**
   * Merge server updates with local cache
   */
  mergeUpdates(localCache: Map<string, any>, serverUpdates: any[]) {
    const merged = new Map(localCache);

    for (const update of serverUpdates) {
      const local = merged.get(update.id);

      if (!local) {
        // New item from server
        merged.set(update.id, update);
      } else if (update.updatedAt > local.lastSyncedAt) {
        // Server version is newer
        merged.set(update.id, { ...local, ...update });
      }
      // else: local version is newer, keep it
    }

    return merged;
  }

  /**
   * Sync offline changes when online
   */
  async syncOfflineChanges(syncQueue: SyncQueueItem[]) {
    const results = [];

    for (const item of syncQueue) {
      try {
        const response = await fetch(`/api/sync/${item.type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          results.push({ id: item.id, success: true });
        } else {
          results.push({
            id: item.id,
            success: false,
            error: 'Server rejected',
          });
        }
      } catch (error) {
        results.push({
          id: item.id,
          success: false,
          error: String(error),
        });
      }
    }

    return results;
  }
}

export const syncManager = new IncrementalSyncManager();
