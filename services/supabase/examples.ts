/**
 * Example usage of Supabase services
 * This file demonstrates how to use the various Supabase services
 */

import { 
  AuthService, 
  DatabaseService, 
  StorageService, 
  SupabaseConnectionTester,
  SupabaseErrorHandler
} from './index';

/**
 * Example: Authentication operations
 */
export const authExamples = {
  // Sign up a new user
  async signUpUser() {
    const result = await AuthService.signUp({
      email: 'user@example.com',
      password: 'securepassword123',
      firstName: 'João',
      lastName: 'Silva',
      role: 'patient',
      phone: '+5511999999999'
    });

    if (result.success) {
      console.log('User created:', result.data?.user);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Sign up failed:', errorInfo.userMessage);
    }

    return result;
  },

  // Sign in existing user
  async signInUser() {
    const result = await AuthService.signIn('user@example.com', 'securepassword123');

    if (result.success) {
      console.log('User signed in:', result.data?.user);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Sign in failed:', errorInfo.userMessage);
    }

    return result;
  },

  // Update user profile
  async updateUserProfile() {
    const result = await AuthService.updateProfile({
      firstName: 'João Carlos',
      phone: '+5511888888888',
      preferences: {
        language: 'pt-BR',
        notifications: true
      }
    });

    if (result.success) {
      console.log('Profile updated:', result.data);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Profile update failed:', errorInfo.userMessage);
    }

    return result;
  }
};

/**
 * Example: Database operations
 */
export const databaseExamples = {
  // Create a new patient record
  async createPatient() {
    const patientData = {
      first_name: 'Maria',
      last_name: 'Santos',
      email: 'maria@example.com',
      phone: '+5511777777777',
      birth_date: '1990-05-15',
      created_at: new Date().toISOString()
    };

    const result = await DatabaseService.insert('patients', patientData);

    if (result.success) {
      console.log('Patient created:', result.data);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Patient creation failed:', errorInfo.userMessage);
    }

    return result;
  },

  // Query patients with filters
  async getPatients() {
    const result = await DatabaseService.select('patients', {
      select: 'id, first_name, last_name, email, phone',
      filter: {
        active: true
      },
      order: { column: 'created_at', ascending: false },
      limit: 10
    });

    if (result.success) {
      console.log(`Found ${result.data?.length} patients:`, result.data);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Patient query failed:', errorInfo.userMessage);
    }

    return result;
  },

  // Update patient record
  async updatePatient(patientId: string) {
    const result = await DatabaseService.update('patients', patientId, {
      phone: '+5511666666666',
      updated_at: new Date().toISOString()
    });

    if (result.success) {
      console.log('Patient updated:', result.data);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('Patient update failed:', errorInfo.userMessage);
    }

    return result;
  }
};

/**
 * Example: Storage operations
 */
export const storageExamples = {
  // Upload a file
  async uploadFile(file: File) {
    const fileName = `avatars/${Date.now()}-${file.name}`;
    
    const result = await StorageService.uploadFile('user-uploads', fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

    if (result.success) {
      console.log('File uploaded:', result.data);
      
      // Get public URL
      const publicUrl = StorageService.getPublicUrl('user-uploads', result.data!.path);
      console.log('Public URL:', publicUrl);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('File upload failed:', errorInfo.userMessage);
    }

    return result;
  },

  // List files in bucket
  async listFiles() {
    const result = await StorageService.listFiles('user-uploads', 'avatars/', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (result.success) {
      console.log(`Found ${result.data?.length} files:`, result.data);
    } else {
      const errorInfo = SupabaseErrorHandler.parseError(result.error);
      console.error('File listing failed:', errorInfo.userMessage);
    }

    return result;
  }
};

/**
 * Example: Connection testing
 */
export const connectionExamples = {
  // Run comprehensive health check
  async runHealthCheck() {
    console.log('Running Supabase health check...');
    
    const healthCheck = await SupabaseConnectionTester.runHealthCheck();
    
    console.log(`Overall status: ${healthCheck.overall}`);
    console.log('Service results:');
    
    healthCheck.results.forEach(result => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${result.service}: ${result.message}`);
      
      if (result.details) {
        console.log(`   Details: ${result.details}`);
      }
    });

    return healthCheck;
  },

  // Test specific table access
  async testTableAccess() {
    const result = await SupabaseConnectionTester.testTableAccess('profiles');
    
    const status = result.status === 'success' ? '✅' : 
                  result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${status} ${result.message}`);
    
    return result;
  }
};

/**
 * Example: Error handling with retry logic
 */
export const errorHandlingExamples = {
  // Retry operation with exponential backoff
  async retryOperation<T>(
    operation: () => Promise<{ success: boolean; error: any; data: T | null }>,
    maxAttempts: number = 3
  ): Promise<{ success: boolean; error: any; data: T | null }> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error;
        const errorInfo = SupabaseErrorHandler.parseError(result.error);
        
        // Log the error
        SupabaseErrorHandler.logError(errorInfo, 'retryOperation');
        
        // Check if we should retry
        if (!SupabaseErrorHandler.shouldRetry(errorInfo, attempt)) {
          console.log('Error is not retryable, stopping attempts');
          break;
        }
        
        // Wait before retrying
        if (attempt < maxAttempts - 1) {
          const delay = SupabaseErrorHandler.getRetryDelay(attempt);
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }
    }
    
    return { success: false, error: lastError, data: null };
  }
};

// Example usage function
export async function runExamples() {
  console.log('=== Supabase Service Examples ===\n');
  
  // Test connection first
  console.log('1. Testing connection...');
  await connectionExamples.runHealthCheck();
  
  console.log('\n2. Testing authentication...');
  // Note: These would require actual valid credentials
  // await authExamples.signUpUser();
  
  console.log('\n3. Testing database operations...');
  // Note: These would require the tables to exist
  // await databaseExamples.getPatients();
  
  console.log('\n4. Testing table access...');
  await connectionExamples.testTableAccess();
  
  console.log('\nExamples completed!');
}

export default {
  authExamples,
  databaseExamples,
  storageExamples,
  connectionExamples,
  errorHandlingExamples,
  runExamples
};