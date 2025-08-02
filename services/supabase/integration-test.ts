/**
 * Simple integration test for Supabase services
 * This file can be run manually to test the Supabase integration
 */

import { 
  supabase, 
  testSupabaseConnection, 
  SupabaseConnectionTester,
  SupabaseErrorHandler 
} from './index';

/**
 * Run basic integration tests
 */
export async function runIntegrationTests() {
  console.log('🧪 Starting Supabase Integration Tests\n');

  // Test 1: Basic connection
  console.log('1. Testing basic connection...');
  try {
    const isConnected = await testSupabaseConnection();
    console.log(isConnected ? '✅ Connection successful' : '❌ Connection failed');
  } catch (error) {
    console.log('❌ Connection test error:', error);
  }

  // Test 2: Health check
  console.log('\n2. Running health check...');
  try {
    const healthCheck = await SupabaseConnectionTester.runHealthCheck();
    console.log(`Overall status: ${healthCheck.overall}`);
    
    healthCheck.results.forEach(result => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${result.service}: ${result.message}`);
    });
  } catch (error) {
    console.log('❌ Health check error:', error);
  }

  // Test 3: Error handler
  console.log('\n3. Testing error handler...');
  try {
    const testError = { message: 'invalid_credentials' };
    const errorInfo = SupabaseErrorHandler.parseError(testError);
    console.log('✅ Error handler working:', {
      type: errorInfo.type,
      userMessage: errorInfo.userMessage,
      retryable: errorInfo.retryable
    });
  } catch (error) {
    console.log('❌ Error handler test failed:', error);
  }

  // Test 4: Environment variables
  console.log('\n4. Checking environment variables...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    console.log('✅ Environment variables configured');
    console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  } else {
    console.log('⚠️ Environment variables not configured');
    console.log('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  }

  // Test 5: Client initialization
  console.log('\n5. Testing client initialization...');
  try {
    if (supabase) {
      console.log('✅ Supabase client initialized');
      console.log(`   Auth: ${typeof supabase.auth}`);
      console.log(`   Database: ${typeof supabase.from}`);
      console.log(`   Storage: ${typeof supabase.storage}`);
    } else {
      console.log('❌ Supabase client not initialized');
    }
  } catch (error) {
    console.log('❌ Client initialization error:', error);
  }

  console.log('\n🏁 Integration tests completed!');
}

// Export for manual testing
export default runIntegrationTests;

// If run directly, execute the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests().catch(console.error);
}