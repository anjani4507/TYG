import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdAt: number;
  memberCount: number;
  isJoined: boolean;
}

interface GroupState {
  groups: Record<string, Group>;
  joinedGroups: string[]; // Array of group IDs
  
  // Group management
  addGroup: (group: Group) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  
  // Membership
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  
  // Getters
  getGroup: (groupId: string) => Group | undefined;
  getJoinedGroups: () => Group[];
  getAllGroups: () => Group[];
  
  // Persistence
  loadGroups: () => Promise<void>;
  saveGroups: () => Promise<void>;
}

const GROUPS_STORAGE_KEY = 'flowfocus_groups';
const JOINED_GROUPS_STORAGE_KEY = 'flowfocus_joined_groups';

export const useGroupStore = create<GroupState>()(
  immer((set, get) => ({
    groups: {},
    joinedGroups: [],

    addGroup: (group: Group) => {
      set((state) => {
        state.groups[group.id] = group;
      });
    },

    updateGroup: (groupId: string, updates: Partial<Group>) => {
      set((state) => {
        if (state.groups[groupId]) {
          state.groups[groupId] = {
            ...state.groups[groupId],
            ...updates,
          };
        }
      });
    },

    removeGroup: (groupId: string) => {
      set((state) => {
        delete state.groups[groupId];
        state.joinedGroups = state.joinedGroups.filter(id => id !== groupId);
      });
    },

    joinGroup: (groupId: string) => {
      set((state) => {
        if (!state.joinedGroups.includes(groupId)) {
          state.joinedGroups.push(groupId);
        }
        if (state.groups[groupId]) {
          state.groups[groupId].isJoined = true;
          state.groups[groupId].memberCount += 1;
        }
      });
      get().saveGroups().catch(console.error);
    },

    leaveGroup: (groupId: string) => {
      set((state) => {
        state.joinedGroups = state.joinedGroups.filter(id => id !== groupId);
        if (state.groups[groupId]) {
          state.groups[groupId].isJoined = false;
          state.groups[groupId].memberCount = Math.max(0, state.groups[groupId].memberCount - 1);
        }
      });
      get().saveGroups().catch(console.error);
    },

    getGroup: (groupId: string) => {
      return get().groups[groupId];
    },

    getJoinedGroups: () => {
      const state = get();
      return state.joinedGroups
        .map(id => state.groups[id])
        .filter((group): group is Group => !!group);
    },

    getAllGroups: () => {
      return Object.values(get().groups);
    },

    loadGroups: async () => {
      try {
        const [groupsJson, joinedJson] = await Promise.all([
          AsyncStorage.getItem(GROUPS_STORAGE_KEY),
          AsyncStorage.getItem(JOINED_GROUPS_STORAGE_KEY),
        ]);

        const groups: Record<string, Group> = groupsJson ? JSON.parse(groupsJson) : {};
        const joinedGroups: string[] = joinedJson ? JSON.parse(joinedJson) : [];

        set((state) => {
          state.groups = groups;
          state.joinedGroups = joinedGroups;
        });
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    },

    saveGroups: async () => {
      try {
        const state = get();
        await Promise.all([
          AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(state.groups)),
          AsyncStorage.setItem(JOINED_GROUPS_STORAGE_KEY, JSON.stringify(state.joinedGroups)),
        ]);
      } catch (error) {
        console.error('Failed to save groups:', error);
      }
    },
  }))
);
