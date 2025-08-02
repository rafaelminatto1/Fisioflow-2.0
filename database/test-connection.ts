import { supabase } from '../services/supabase/supabaseClient';

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful!');
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (this is normal for initial setup)');
    } else if (user) {
      console.log(`✅ Authenticated as: ${user.email}`);
    }

    // Test if migrations table exists
    const { data: migrationData, error: migrationError } = await supabase
      .from('schema_migrations')
      .select('count')
      .limit(1);

    if (migrationError) {
      console.log('ℹ️  Migrations table not found - run migrations first');
    } else {
      console.log('✅ Migrations table exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };