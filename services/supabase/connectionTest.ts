import { supabase, testSupabaseConnection } from './client';
import { AuthService } from './authService';
import { DatabaseService } from './databaseService';
import { StorageService } from './storageService';

export interface ConnectionTestResult {
  service: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export interface SupabaseHealthCheck {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  results: ConnectionTestResult[];
  timestamp: Date;
}

/**
 * Comprehensive Supabase connection and service testing
 */
export class SupabaseConnectionTester {
  /**
   * Run all connection tests
   */
  static async runHealthCheck(): Promise<SupabaseHealthCheck> {
    const results: ConnectionTestResult[] = [];
    
    // Test basic connection
    const connectionResult = await this.testConnection();
    results.push(connectionResult);
    
    // Test authentication service
    const authResult = await this.testAuthService();
    results.push(authResult);
    
    // Test database service
    const dbResult = await this.testDatabaseService();
    results.push(dbResult);
    
    // Test storage service
    const storageResult = await this.testStorageService();
    results.push(storageResult);
    
    // Determine overall health
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (errorCount > 0) {
      overall = 'unhealthy';
    } else if (warningCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    return {
      overall,
      results,
      timestamp: new Date()
    };
  }

  /**
   * Test basic Supabase connection
   */
  private static async testConnection(): Promise<ConnectionTestResult> {
    try {
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        return {
          service: 'Connection',
          status: 'success',
          message: 'Successfully connected to Supabase'
        };
      } else {
        return {
          service: 'Connection',
          status: 'error',
          message: 'Failed to connect to Supabase - check configuration'
        };
      }
    } catch (error) {
      return {
        service: 'Connection',
        status: 'error',
        message: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test authentication service
   */
  private static async testAuthService(): Promise<ConnectionTestResult> {
    try {
      // Test getting current session (should work even if no user is logged in)
      const sessionResult = await AuthService.getCurrentSession();
      
      if (sessionResult.success || sessionResult.error?.message.includes('session_not_found')) {
        return {
          service: 'Authentication',
          status: 'success',
          message: 'Authentication service is working correctly'
        };
      } else {
        return {
          service: 'Authentication',
          status: 'error',
          message: 'Authentication service test failed',
          details: sessionResult.error?.message
        };
      }
    } catch (error) {
      return {
        service: 'Authentication',
        status: 'error',
        message: 'Authentication service test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test database service
   */
  private static async testDatabaseService(): Promise<ConnectionTestResult> {
    try {
      // Try to query a system table that should always exist
      const result = await DatabaseService.executeRpc('version');
      
      if (result.success) {
        return {
          service: 'Database',
          status: 'success',
          message: 'Database service is working correctly'
        };
      } else {
        // If RPC fails, try a simple select on profiles table
        const profilesResult = await DatabaseService.select('profiles', { limit: 1 });
        
        if (profilesResult.success || profilesResult.error?.message.includes('relation "profiles" does not exist')) {
          return {
            service: 'Database',
            status: 'warning',
            message: 'Database connection works but profiles table may not exist yet'
          };
        } else {
          return {
            service: 'Database',
            status: 'error',
            message: 'Database service test failed',
            details: profilesResult.error?.message
          };
        }
      }
    } catch (error) {
      return {
        service: 'Database',
        status: 'error',
        message: 'Database service test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test storage service
   */
  private static async testStorageService(): Promise<ConnectionTestResult> {
    try {
      // Try to list buckets (this should work even if no buckets exist)
      const { data, error } = await supabase.storage.listBuckets();
      
      if (!error) {
        return {
          service: 'Storage',
          status: 'success',
          message: 'Storage service is working correctly',
          details: `Found ${data?.length || 0} storage buckets`
        };
      } else {
        return {
          service: 'Storage',
          status: 'error',
          message: 'Storage service test failed',
          details: error.message
        };
      }
    } catch (error) {
      return {
        service: 'Storage',
        status: 'error',
        message: 'Storage service test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test specific table access
   */
  static async testTableAccess(tableName: string): Promise<ConnectionTestResult> {
    try {
      const result = await DatabaseService.select(tableName, { limit: 1 });
      
      if (result.success) {
        return {
          service: `Table: ${tableName}`,
          status: 'success',
          message: `Table ${tableName} is accessible`,
          details: `Found ${result.count || 0} records`
        };
      } else {
        return {
          service: `Table: ${tableName}`,
          status: 'error',
          message: `Table ${tableName} access failed`,
          details: result.error?.message
        };
      }
    } catch (error) {
      return {
        service: `Table: ${tableName}`,
        status: 'error',
        message: `Table ${tableName} test failed`,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test storage bucket access
   */
  static async testBucketAccess(bucketName: string): Promise<ConnectionTestResult> {
    try {
      const result = await StorageService.listFiles(bucketName);
      
      if (result.success) {
        return {
          service: `Bucket: ${bucketName}`,
          status: 'success',
          message: `Bucket ${bucketName} is accessible`,
          details: `Found ${result.data?.length || 0} files`
        };
      } else {
        return {
          service: `Bucket: ${bucketName}`,
          status: 'error',
          message: `Bucket ${bucketName} access failed`,
          details: result.error?.message
        };
      }
    } catch (error) {
      return {
        service: `Bucket: ${bucketName}`,
        status: 'error',
        message: `Bucket ${bucketName} test failed`,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default SupabaseConnectionTester;