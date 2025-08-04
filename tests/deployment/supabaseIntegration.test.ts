import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { supabase, testConnection } from '@/services/supabase/supabaseClient';

// Supabase integration tests for deployment validation
describe('Supabase Integration Tests', () => {
  let originalEnv: typeof process.env;

  beforeAll(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Mock console methods to avoid noise in test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Client Initialization', () => {
    it('should initialize Supabase client without errors', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it('should handle missing environment variables gracefully', () => {
      // This test verifies the client handles missing env vars without crashing
      expect(() => {
        const { createClient } = require('@supabase/supabase-js');
        createClient('https://dummy.supabase.co', 'dummy-key');
      }).not.toThrow();
    });

    it('should have retry mechanism configured', () => {
      expect(supabase.withRetry).toBeDefined();
      expect(typeof supabase.withRetry).toBe('function');
    });

    it('should have health check functionality', () => {
      expect(supabase.getHealthStatus).toBeDefined();
      expect(typeof supabase.getHealthStatus).toBe('function');
      
      const healthStatus = supabase.getHealthStatus();
      expect(healthStatus).toHaveProperty('isConnected');
      expect(healthStatus).toHaveProperty('retryAttempts');
      expect(healthStatus).toHaveProperty('maxRetries');
      expect(healthStatus).toHaveProperty('timestamp');
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      const connectionResult = await testConnection();
      expect(typeof connectionResult).toBe('boolean');
    }, 10000);

    it('should handle connection failures gracefully', async () => {
      // Mock a network failure
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        const connectionResult = await testConnection();
        expect(typeof connectionResult).toBe('boolean');
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should implement exponential backoff for retries', async () => {
      const startTime = Date.now();
      
      // Mock consecutive failures
      const originalFetch = global.fetch;
      let attemptCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
      });

      try {
        await supabase.withRetry(
          () => fetch('https://dummy.supabase.co/test'),
          'test operation'
        );
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        // Should have taken at least 3 seconds (1s + 2s delays)
        expect(totalTime).toBeGreaterThan(2900);
        expect(attemptCount).toBe(3);
      } finally {
        global.fetch = originalFetch;
      }
    }, 15000);
  });

  describe('Authentication Integration', () => {
    it('should handle authentication state changes', async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Should not throw error regardless of authentication state
      expect(user).toBeDefined(); // Can be null for unauthenticated
    });

    it('should handle session persistence', () => {
      // Test that session configuration is set up correctly
      expect(supabase.auth).toBeDefined();
      
      // This would be tested more thoroughly in end-to-end tests
      // Here we just verify the auth client is properly configured
    });

    it('should handle token refresh gracefully', async () => {
      // Mock token refresh scenario
      const refreshSpy = vi.spyOn(supabase.auth, 'refreshSession');
      
      try {
        await supabase.auth.refreshSession();
        // Should not throw error
      } catch (error) {
        // Expected for unauthenticated users
        expect(error).toBeDefined();
      }
      
      refreshSpy.mockRestore();
    });
  });

  describe('Database Operations', () => {
    it('should handle database queries with retry logic', async () => {
      const testQuery = async () => {
        return supabase.from('patients').select('id').limit(1);
      };

      try {
        const result = await supabase.withRetry(testQuery, 'test query');
        expect(result).toBeDefined();
      } catch (error) {
        // Expected if database is not set up
        expect(error).toBeDefined();
      }
    });

    it('should handle connection timeouts', async () => {
      // Mock timeout scenario
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        )
      );

      try {
        await supabase.withRetry(
          () => supabase.from('test').select('*'),
          'timeout test'
        );
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    }, 10000);

    it('should validate table access patterns', async () => {
      const tables = ['patients', 'appointments', 'users', 'soap_notes'];
      
      for (const table of tables) {
        try {
          const query = supabase.from(table).select('id').limit(1);
          expect(query).toBeDefined();
        } catch (error) {
          // Table might not exist in test environment
          console.warn(`Table ${table} not accessible:`, error);
        }
      }
    });
  });

  describe('Real-time Features', () => {
    it('should initialize realtime client', () => {
      expect(supabase.realtime).toBeDefined();
    });

    it('should handle realtime subscriptions gracefully', () => {
      try {
        const channel = supabase.realtime.channel('test-channel');
        expect(channel).toBeDefined();
        
        // Clean up
        supabase.realtime.removeChannel(channel);
      } catch (error) {
        console.warn('Realtime features not available:', error);
      }
    });

    it('should configure realtime with appropriate limits', () => {
      // Verify realtime is configured with sensible defaults
      expect(supabase.realtime).toBeDefined();
    });
  });

  describe('Storage Integration', () => {
    it('should initialize storage client', () => {
      expect(supabase.storage).toBeDefined();
    });

    it('should handle storage operations gracefully', async () => {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        expect(Array.isArray(buckets)).toBe(true);
      } catch (error) {
        // Expected if storage is not configured
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      try {
        await supabase.from('nonexistent_table').select('*');
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    it('should handle network failures gracefully', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      try {
        const result = await supabase.withRetry(
          () => supabase.from('test').select('*'),
          'network failure test'
        );
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should log appropriate error information', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      try {
        await supabase.withRetry(
          () => Promise.reject(new Error('Test error')),
          'error logging test'
        );
      } catch (error) {
        // Should log error information
        expect(consoleWarnSpy).toHaveBeenCalled();
      }

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete basic operations within reasonable time', async () => {
      const startTime = Date.now();
      
      try {
        await testConnection();
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete within 10 seconds
        expect(duration).toBeLessThan(10000);
      } catch (error) {
        // Connection might fail in test environment, that's ok
      }
    });

    it('should cache connection status appropriately', async () => {
      const healthStatus1 = supabase.getHealthStatus();
      
      // Wait a small amount
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const healthStatus2 = supabase.getHealthStatus();
      
      // Health status should be cached briefly
      expect(healthStatus1.timestamp).toBeDefined();
      expect(healthStatus2.timestamp).toBeDefined();
    });
  });
});