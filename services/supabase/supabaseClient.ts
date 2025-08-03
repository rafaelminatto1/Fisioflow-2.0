import { createClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured. Authentication will fall back to mock mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'FisioFlow',
    },
  },
});

// Type helpers for better TypeScript support
export type SupabaseClient = typeof supabase;

// Connection test function
export const testConnection = async (): Promise<boolean> => {
  try {
    // Use auth.getUser() which always works regardless of login status
    const { data, error } = await supabase.auth.getUser();
    
    // If we get here without a network error, connection is working
    // "Auth session missing!" is expected when no user is logged in
    return !error || 
           error.message.includes('Auth session missing') || 
           error.message.includes('JWT') ||
           error.message.includes('session_not_found');
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
    return false;
  }
};

export default supabase;

// Re-export database service for convenience
export { DatabaseService } from './databaseService';