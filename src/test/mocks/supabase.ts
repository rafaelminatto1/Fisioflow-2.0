import { vi } from 'vitest';
import { mockUsers } from '../utils';

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    // Mock resolved values - these will be overridden in tests
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: null }, 
      error: null 
    }),
    getSession: vi.fn().mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    }),
    signInWithPassword: vi.fn().mockResolvedValue({ 
      data: { user: mockUsers.admin, session: {} }, 
      error: null 
    }),
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: mockUsers.admin, session: {} }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ 
      error: null 
    }),
    updateUser: vi.fn().mockResolvedValue({ 
      data: { user: mockUsers.admin }, 
      error: null 
    }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ 
      data: {}, 
      error: null 
    }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { 
        subscription: { 
          unsubscribe: vi.fn() 
        } 
      }
    }),
    refreshSession: vi.fn().mockResolvedValue({ 
      data: { session: {}, user: mockUsers.admin }, 
      error: null 
    }),
  };

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ 
        data: { path: 'test-path/file.jpg' }, 
        error: null 
      }),
      download: vi.fn().mockResolvedValue({ 
        data: new Blob(['test content'], { type: 'image/jpeg' }), 
        error: null 
      }),
      remove: vi.fn().mockResolvedValue({ 
        data: null, 
        error: null 
      }),
      list: vi.fn().mockResolvedValue({ 
        data: [
          { name: 'file1.jpg', id: '1', updated_at: '2024-01-01T00:00:00Z' },
          { name: 'file2.jpg', id: '2', updated_at: '2024-01-01T00:00:00Z' }
        ], 
        error: null 
      }),
      getPublicUrl: vi.fn().mockReturnValue({ 
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/test-bucket/test-path/file.jpg' } 
      }),
      createSignedUrl: vi.fn().mockResolvedValue({ 
        data: { signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test-bucket/test-path/file.jpg?token=test' }, 
        error: null 
      }),
      createSignedUrls: vi.fn().mockResolvedValue({ 
        data: [
          { path: 'file1.jpg', signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test-bucket/file1.jpg?token=test1' },
          { path: 'file2.jpg', signedUrl: 'https://test.supabase.co/storage/v1/object/sign/test-bucket/file2.jpg?token=test2' }
        ], 
        error: null 
      }),
      move: vi.fn().mockResolvedValue({ 
        data: { message: 'Successfully moved' }, 
        error: null 
      }),
      copy: vi.fn().mockResolvedValue({ 
        data: { path: 'new-path/file.jpg' }, 
        error: null 
      }),
    }),
  };

  const mockRealtime = {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    }),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    getChannels: vi.fn().mockReturnValue([]),
  };

  return {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: mockAuth,
    storage: mockStorage,
    realtime: mockRealtime,
    rpc: vi.fn().mockResolvedValue({ 
      data: null, 
      error: null 
    }),
    // Helper methods for testing
    __setMockData: (data: any) => {
      mockQuery.then.mockResolvedValue({ data, error: null });
      return mockQuery;
    },
    __setMockError: (error: any) => {
      mockQuery.then.mockResolvedValue({ data: null, error });
      return mockQuery;
    },
    __setAuthUser: (user: any) => {
      mockAuth.getUser.mockResolvedValue({ data: { user }, error: null });
      mockAuth.getSession.mockResolvedValue({ data: { session: user ? {} : null }, error: null });
    },
    __resetMocks: () => {
      vi.clearAllMocks();
      mockQuery.then.mockResolvedValue({ data: [], error: null });
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    },
  };
};

// Create a singleton mock instance
export const mockSupabaseClient = createMockSupabaseClient();

// Mock the Supabase client module
vi.mock('../../services/supabase/supabaseClient', () => ({
  supabase: mockSupabaseClient,
  testConnection: vi.fn().mockResolvedValue(true),
  default: mockSupabaseClient,
}));

// Mock the database service
vi.mock('../../services/supabase/DatabaseService', () => {
  const mockDatabaseService = {
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
    selectById: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    insertMany: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    updateMany: vi.fn().mockResolvedValue({ data: [], error: null }),
    delete: vi.fn().mockResolvedValue({ data: true, error: null }),
    deleteMany: vi.fn().mockResolvedValue({ data: true, error: null }),
    count: vi.fn().mockResolvedValue({ data: 0, error: null }),
    exists: vi.fn().mockResolvedValue({ data: false, error: null }),
    executeRaw: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  return {
    DatabaseService: vi.fn().mockImplementation(() => mockDatabaseService),
    databaseService: mockDatabaseService,
  };
});

// Export mock helpers
export const mockSupabaseHelpers = {
  setMockData: (data: any) => mockSupabaseClient.__setMockData(data),
  setMockError: (error: any) => mockSupabaseClient.__setMockError(error),
  setAuthUser: (user: any) => mockSupabaseClient.__setAuthUser(user),
  resetMocks: () => mockSupabaseClient.__resetMocks(),
};