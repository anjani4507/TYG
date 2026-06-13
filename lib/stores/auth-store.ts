import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionToken: string | null;
  
  // Auth actions
  setUser: (user: UserProfile | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Persistence
  loadAuthState: () => Promise<void>;
  saveAuthState: () => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'flowfocus_auth_state';
const TOKEN_STORAGE_KEY = 'flowfocus_session_token';

export const useAuthStore = create<AuthState>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sessionToken: null,

    setUser: (user: UserProfile | null) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      });
    },

    setSessionToken: (token: string | null) => {
      set((state) => {
        state.sessionToken = token;
      });
    },

    setIsLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    loadAuthState: async () => {
      try {
        const [userJson, token] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEY),
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
        ]);

        if (userJson) {
          const user = JSON.parse(userJson);
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.sessionToken = token;
          });
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
        set((state) => {
          state.error = 'Failed to restore session';
        });
      }
    },

    saveAuthState: async () => {
      try {
        const state = get();
        if (state.user && state.sessionToken) {
          await Promise.all([
            AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state.user)),
            AsyncStorage.setItem(TOKEN_STORAGE_KEY, state.sessionToken),
          ]);
        }
      } catch (error) {
        console.error('Failed to save auth state:', error);
      }
    },

    logout: async () => {
      try {
        await Promise.all([
          AsyncStorage.removeItem(AUTH_STORAGE_KEY),
          AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
        ]);

        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.sessionToken = null;
          state.error = null;
        });
      } catch (error) {
        console.error('Failed to logout:', error);
        set((state) => {
          state.error = 'Failed to logout';
        });
      }
    },
  }))
);
