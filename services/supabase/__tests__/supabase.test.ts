import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService, DatabaseService, StorageService, SupabaseErrorHandler } from '../index';

// Mock Supabase client
vi.mock('../client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      limit: vi.fn().mockReturnThis()
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(),
        createSignedUrl: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        move: vi.fn(),
        copy: vi.fn()
      })),
      createBucket: vi.fn(),
      deleteBucket: vi.fn(),
      getBucket: vi.fn(),
      listBuckets: vi.fn()
    },
    rpc: vi.fn()
  },
  testSupabaseConnection: vi.fn()
}));

describe('Supabase Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthService', () => {
    it('should handle successful sign in', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { access_token: 'token123' };
      
      const { supabase } = await import('../client');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await AuthService.signIn('test@example.com', 'password');

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle sign in error', async () => {
      const mockError = { message: 'invalid_credentials' };
      
      const { supabase } = await import('../client');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await AuthService.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
    });

    it('should handle sign up with profile creation', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      const { supabase } = await import('../client');
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      // Mock profile creation
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await AuthService.signUp({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'patient'
      });

      expect(result.success).toBe(true);
      expect(result.data?.user).toEqual(mockUser);
    });
  });

  describe('DatabaseService', () => {
    it('should handle successful select operation', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      
      const { supabase } = await import('../client');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await DatabaseService.select('test_table', {
        filter: { active: true },
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(1);
    });

    it('should handle database error', async () => {
      const mockError = { code: '23505', message: 'duplicate key value' };
      
      const { supabase } = await import('../client');
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: mockError, count: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await DatabaseService.select('test_table');

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
    });

    it('should handle insert operation', async () => {
      const mockData = { id: '1', name: 'Test' };
      
      const { supabase } = await import('../client');
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null })
      };
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await DatabaseService.insert('test_table', { name: 'Test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe('StorageService', () => {
    it('should handle file upload', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockUploadResult = { path: 'test/test.txt', fullPath: 'bucket/test/test.txt' };
      
      const { supabase } = await import('../client');
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: mockUploadResult, error: null })
      };
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorage);

      const result = await StorageService.uploadFile('test-bucket', 'test/test.txt', mockFile);

      expect(result.success).toBe(true);
      expect(result.data?.path).toBe(mockUploadResult.path);
    });

    it('should handle storage error', async () => {
      const mockError = { message: 'BucketNotFound' };
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const { supabase } = await import('../client');
      const mockStorage = {
        upload: vi.fn().mockResolvedValue({ data: null, error: mockError })
      };
      vi.mocked(supabase.storage.from).mockReturnValue(mockStorage);

      const result = await StorageService.uploadFile('invalid-bucket', 'test.txt', mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(mockError);
    });
  });

  describe('SupabaseErrorHandler', () => {
    it('should parse authentication errors correctly', () => {
      const authError = { message: 'invalid_credentials' };
      const errorInfo = SupabaseErrorHandler.parseError(authError);

      expect(errorInfo.type).toBe('auth');
      expect(errorInfo.code).toBe('invalid_credentials');
      expect(errorInfo.userMessage).toBe('Email ou senha incorretos.');
      expect(errorInfo.retryable).toBe(false);
    });

    it('should parse database errors correctly', () => {
      const dbError = { code: '23505', message: 'duplicate key value' };
      const errorInfo = SupabaseErrorHandler.parseError(dbError);

      expect(errorInfo.type).toBe('database');
      expect(errorInfo.code).toBe('23505');
      expect(errorInfo.userMessage).toBe('Este registro já existe.');
      expect(errorInfo.retryable).toBe(false);
    });

    it('should parse storage errors correctly', () => {
      const storageError = { message: 'BucketNotFound' };
      const errorInfo = SupabaseErrorHandler.parseError(storageError);

      expect(errorInfo.type).toBe('storage');
      expect(errorInfo.code).toBe('BucketNotFound');
      expect(errorInfo.userMessage).toBe('Local de armazenamento não encontrado.');
      expect(errorInfo.retryable).toBe(false);
    });

    it('should handle network errors', () => {
      const networkError = { name: 'NetworkError', message: 'fetch failed' };
      const errorInfo = SupabaseErrorHandler.parseError(networkError);

      expect(errorInfo.type).toBe('network');
      expect(errorInfo.retryable).toBe(true);
    });

    it('should determine retry logic correctly', () => {
      const retryableError = { type: 'network', retryable: true, code: 'NETWORK_ERROR' } as any;
      const nonRetryableError = { type: 'auth', retryable: false, code: 'invalid_credentials' } as any;

      expect(SupabaseErrorHandler.shouldRetry(retryableError, 0)).toBe(true);
      expect(SupabaseErrorHandler.shouldRetry(nonRetryableError, 0)).toBe(false);
      expect(SupabaseErrorHandler.shouldRetry(retryableError, 3)).toBe(false); // Max attempts reached
    });

    it('should calculate retry delay correctly', () => {
      expect(SupabaseErrorHandler.getRetryDelay(0)).toBe(1000);
      expect(SupabaseErrorHandler.getRetryDelay(1)).toBe(2000);
      expect(SupabaseErrorHandler.getRetryDelay(2)).toBe(4000);
      expect(SupabaseErrorHandler.getRetryDelay(10)).toBe(10000); // Max delay
    });
  });
});