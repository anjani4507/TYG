import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Environment variables - these should be set in your .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured');
}

/**
 * Custom storage adapter for Supabase Auth
 * Uses expo-secure-store on native platforms, localStorage on web
 */
const createSupabaseStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage on web
    return {
      getItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      },
    };
  }

  // Use SecureStore on native platforms
  return {
    getItem: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error(`Error reading from SecureStore: ${key}`, error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.error(`Error writing to SecureStore: ${key}`, error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error(`Error removing from SecureStore: ${key}`, error);
      }
    },
  };
};

/**
 * Initialize Supabase client with custom storage adapter
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createSupabaseStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Database types - extend these with your actual Supabase schema
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          creator_id: string;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description: string;
          creator_id: string;
        };
        Update: {
          name?: string;
          description?: string;
          member_count?: number;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          group_id?: string;
          subject: string;
          duration: number; // in seconds
          intensity_score: number; // 1-10
          started_at: string;
          ended_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          group_id?: string;
          subject: string;
          duration: number;
          intensity_score: number;
          started_at: string;
          ended_at: string;
        };
      };
      presence_events: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          status: 'active' | 'idle' | 'offline';
          intensity?: number;
          session_id?: string;
          timestamp: string;
        };
        Insert: {
          user_id: string;
          group_id: string;
          status: 'active' | 'idle' | 'offline';
          intensity?: number;
          session_id?: string;
        };
      };
    };
  };
}

export type Tables = Database['public']['Tables'];
export type Profiles = Tables['profiles']['Row'];
export type Groups = Tables['groups']['Row'];
export type GroupMembers = Tables['group_members']['Row'];
export type Sessions = Tables['sessions']['Row'];
export type PresenceEvents = Tables['presence_events']['Row'];
