// Main Supabase service exports
export { supabase, testConnection } from './supabaseClient';
export { AuthService } from './authService';
export { DatabaseService } from './databaseService';
export { StorageService } from './storageService';

// Type exports
export type { 
  UserRegistration, 
  ProfileUpdate, 
  AuthServiceResponse 
} from './authService';

export type { 
  QueryOptions, 
  DatabaseServiceResponse 
} from './databaseService';

export type { 
  UploadOptions, 
  StorageServiceResponse 
} from './storageService';

// Re-export Supabase types for convenience
export type {
  User,
  Session,
  AuthError,
  PostgrestError,
  StorageError,
  FileObject
} from '@supabase/supabase-js';