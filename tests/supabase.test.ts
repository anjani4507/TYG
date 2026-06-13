import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Supabase Configuration', () => {
  let supabase: any;

  beforeAll(() => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(url).toBeDefined();
    expect(key).toBeDefined();

    supabase = createClient(url!, key!);
  });

  it('should connect to Supabase successfully', async () => {
    try {
      // Test connection by querying auth status
      const { data, error } = await supabase.auth.getSession();
      
      // We expect this to work even if no session exists
      expect(error).toBeNull();
      expect(data).toBeDefined();
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error}`);
    }
  });

  it('should have valid Supabase URL format', () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(url).toMatch(/^https:\/\/.*\.supabase\.co$/);
  });

  it('should have valid Supabase key format', () => {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(0);
  });
});
