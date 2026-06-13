import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type PresenceStatus = 'active' | 'idle' | 'offline';

export interface UserPresence {
  userId: string;
  userName: string;
  status: PresenceStatus;
  intensity?: number;
  lastSeen: number;
  currentSessionId?: string;
}

export interface GroupPresence {
  groupId: string;
  members: Record<string, UserPresence>;
  lastUpdated: number;
}

interface PresenceState {
  groupPresences: Record<string, GroupPresence>;
  
  // Presence updates
  updateUserPresence: (groupId: string, userId: string, presence: Partial<UserPresence>) => void;
  setGroupPresence: (groupId: string, presence: GroupPresence) => void;
  removeUserPresence: (groupId: string, userId: string) => void;
  
  // Getters
  getGroupMembers: (groupId: string) => UserPresence[];
  getActiveMembersCount: (groupId: string) => number;
  getUserPresence: (groupId: string, userId: string) => UserPresence | undefined;
  
  // Cleanup
  clearGroupPresence: (groupId: string) => void;
}

export const usePresenceStore = create<PresenceState>()(
  immer((set, get) => ({
    groupPresences: {},

    updateUserPresence: (groupId: string, userId: string, presence: Partial<UserPresence>) => {
      set((state) => {
        if (!state.groupPresences[groupId]) {
          state.groupPresences[groupId] = {
            groupId,
            members: {},
            lastUpdated: Date.now(),
          };
        }

        const existing = state.groupPresences[groupId].members[userId];
        state.groupPresences[groupId].members[userId] = {
          userId,
          userName: existing?.userName || presence.userName || 'Unknown',
          status: presence.status || existing?.status || 'offline',
          intensity: presence.intensity ?? existing?.intensity,
          lastSeen: Date.now(),
          currentSessionId: presence.currentSessionId ?? existing?.currentSessionId,
        };

        state.groupPresences[groupId].lastUpdated = Date.now();
      });
    },

    setGroupPresence: (groupId: string, presence: GroupPresence) => {
      set((state) => {
        state.groupPresences[groupId] = {
          ...presence,
          lastUpdated: Date.now(),
        };
      });
    },

    removeUserPresence: (groupId: string, userId: string) => {
      set((state) => {
        if (state.groupPresences[groupId]) {
          delete state.groupPresences[groupId].members[userId];
          state.groupPresences[groupId].lastUpdated = Date.now();
        }
      });
    },

    getGroupMembers: (groupId: string) => {
      const state = get();
      const presence = state.groupPresences[groupId];
      if (!presence) return [];
      return Object.values(presence.members);
    },

    getActiveMembersCount: (groupId: string) => {
      const state = get();
      const presence = state.groupPresences[groupId];
      if (!presence) return 0;
      return Object.values(presence.members).filter(m => m.status === 'active').length;
    },

    getUserPresence: (groupId: string, userId: string) => {
      const state = get();
      return state.groupPresences[groupId]?.members[userId];
    },

    clearGroupPresence: (groupId: string) => {
      set((state) => {
        delete state.groupPresences[groupId];
      });
    },
  }))
);
