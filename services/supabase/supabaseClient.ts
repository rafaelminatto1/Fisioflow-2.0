import { createClient, SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

// Enhanced Supabase client with optimizations for Vercel deployment
class OptimizedSupabaseClient {
  private client: BaseSupabaseClient;
  private isConnected: boolean = false;
  private connectionPromise: Promise<boolean> | null = null;
  private retryAttempts: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000; // 1 second

  constructor() {
    // Environment variables with fallbacks for Vite
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key';

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured. Authentication will fall back to mock mode.');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'FisioFlow',
          'x-client-version': '2.0'
        },
        fetch: this.createFetchWithRetry()
      }
    });

    // Initialize connection on instantiation
    this.testConnection();
  }

  // Create fetch function with retry logic
  private createFetchWithRetry() {
    return async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
      let lastError: Error;

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          // Reset retry attempts on successful request
          this.retryAttempts = 0;
          
          return response;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on certain types of errors
          if (error instanceof TypeError && error.message.includes('abort')) {
            throw error; // Don't retry timeout errors
          }

          if (attempt < this.maxRetries) {
            // Exponential backoff
            const delay = this.retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            this.retryAttempts++;
          }
        }
      }

      throw lastError!;
    };
  }

  // Enhanced connection test with retry logic
  public async testConnection(): Promise<boolean> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnectionTest();
    const result = await this.connectionPromise;
    this.connectionPromise = null;
    return result;
  }

  private async performConnectionTest(): Promise<boolean> {
    try {
      // Use auth.getUser() which always works regardless of login status
      const { data, error } = await this.client.auth.getUser();
      
      // If we get here without a network error, connection is working
      const isConnected = !error || 
                         error.message.includes('Auth session missing') || 
                         error.message.includes('JWT') ||
                         error.message.includes('session_not_found');
      
      this.isConnected = isConnected;
      
      if (this.isConnected) {
        console.log('✅ Supabase connection established successfully');
      } else {
        console.warn('⚠️ Supabase connection test failed:', error?.message);
      }

      return isConnected;
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Enhanced error handling for database operations
  public async withRetry<T>(
    operation: () => Promise<T>,
    context: string = 'database operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Ensure connection before operation
        if (!this.isConnected) {
          await this.testConnection();
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`Attempt ${attempt + 1}/${this.maxRetries + 1} failed for ${context}:`, error);

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`All retry attempts exhausted for ${context}`);
    throw lastError!;
  }

  // Expose the underlying client with enhanced methods
  public get auth() {
    return this.client.auth;
  }

  public get from() {
    return this.client.from.bind(this.client);
  }

  public get storage() {
    return this.client.storage;
  }

  public get functions() {
    return this.client.functions;
  }

  public get realtime() {
    return this.client.realtime;
  }

  public get rpc() {
    return this.client.rpc.bind(this.client);
  }

  // Health check method for monitoring
  public getHealthStatus() {
    return {
      isConnected: this.isConnected,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries,
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const optimizedClient = new OptimizedSupabaseClient();

// Export the optimized client
export const supabase = optimizedClient;

// Type helpers for better TypeScript support
export type SupabaseClient = typeof optimizedClient;

// Legacy compatibility - maintain existing API
export const testConnection = () => optimizedClient.testConnection();

export default optimizedClient;

// Re-export database service for convenience
export { DatabaseService } from './databaseService';