import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface Session {
  id: string;
  userId: string;
  groupId?: string;
  subject: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
  intensity: number; // 1-10
  status: SessionStatus;
  isPaused: boolean;
  pausedAt?: number;
  totalPausedTime: number; // in seconds
}

interface SessionState {
  currentSession: Session | null;
  sessionHistory: Session[];
  
  // Session control
  startSession: (subject: string, groupId?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  setIntensity: (intensity: number) => void;
  setSubject: (subject: string) => void;
  
  // History
  addToHistory: (session: Session) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => void;
  
  // Getters
  getElapsedTime: () => number;
  getTotalDuration: () => number;
}

const STORAGE_KEY = 'flowfocus_session_history';

export const useSessionStore = create<SessionState>()(
  immer((set, get) => ({
    currentSession: null,
    sessionHistory: [],

    startSession: (subject: string, groupId?: string) => {
      // Validate input
      if (!subject || subject.trim().length === 0) {
        console.warn('Cannot start session: subject is required');
        return;
      }

      const now = Date.now();
      const sessionId = `session_${now}_${Math.random().toString(36).substr(2, 9)}`;
      
      set((state) => {
        state.currentSession = {
          id: sessionId,
          userId: '', // Will be set from auth context
          groupId,
          subject: subject.trim(),
          startTime: now,
          duration: 0,
          intensity: 5,
          status: 'active',
          isPaused: false,
          totalPausedTime: 0,
        };
      });
    },

    pauseSession: () => {
      set((state) => {
        if (!state.currentSession) {
          console.warn('Cannot pause: no active session');
          return;
        }
        if (state.currentSession.isPaused) {
          console.warn('Session already paused');
          return;
        }
        state.currentSession.isPaused = true;
        state.currentSession.pausedAt = Date.now();
        state.currentSession.status = 'paused';
      });
    },

    resumeSession: () => {
      set((state) => {
        if (state.currentSession && state.currentSession.isPaused && state.currentSession.pausedAt) {
          const pauseDuration = Date.now() - state.currentSession.pausedAt;
          state.currentSession.totalPausedTime += pauseDuration;
          state.currentSession.isPaused = false;
          state.currentSession.pausedAt = undefined;
          state.currentSession.status = 'active';
        }
      });
    },

    endSession: () => {
      set((state) => {
        if (state.currentSession) {
          const endTime = Date.now();
          const totalTime = endTime - state.currentSession.startTime - state.currentSession.totalPausedTime;
          
          state.currentSession.endTime = endTime;
          state.currentSession.duration = Math.floor(totalTime / 1000); // Convert to seconds
          state.currentSession.status = 'completed';
          state.currentSession.isPaused = false;
          
          // Add to history
          state.sessionHistory.unshift(state.currentSession);
          
          // Persist to storage
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessionHistory)).catch(console.error);
          
          state.currentSession = null;
        }
      });
    },

    setIntensity: (intensity: number) => {
      set((state) => {
        if (state.currentSession) {
          state.currentSession.intensity = Math.max(1, Math.min(10, intensity));
        }
      });
    },

    setSubject: (subject: string) => {
      set((state) => {
        if (state.currentSession) {
          state.currentSession.subject = subject;
        }
      });
    },

    addToHistory: (session: Session) => {
      set((state) => {
        state.sessionHistory.unshift(session);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessionHistory)).catch(console.error);
      });
    },

    loadHistory: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          set((state) => {
            state.sessionHistory = JSON.parse(stored);
          });
        }
      } catch (error) {
        console.error('Failed to load session history:', error);
      }
    },

    clearHistory: () => {
      set((state) => {
        state.sessionHistory = [];
        AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
      });
    },

    getElapsedTime: () => {
      const state = get();
      if (!state.currentSession) return 0;
      
      const now = Date.now();
      const elapsed = now - state.currentSession.startTime - state.currentSession.totalPausedTime;
      return Math.floor(elapsed / 1000); // Return in seconds
    },

    getTotalDuration: () => {
      const state = get();
      return state.sessionHistory.reduce((sum, session) => sum + session.duration, 0);
    },
  }))
);
