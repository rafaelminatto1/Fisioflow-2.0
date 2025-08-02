import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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
    const { data, error } = await supabase
      .from('test')
      .select('count')
      .limit(1)
      .maybeSingle();
    
    return !error;
  } catch (error) {
    console.warn('Supabase connection test failed:', error);
    return false;
  }
};

export default supabase;

// Re-export database service for convenience
export { databaseService, DatabaseService } from './DatabaseService';