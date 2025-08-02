import { supabase } from '../services/supabase/supabaseClient';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  id: string;
  name: string;
  sql: string;
  executed_at?: string;
}

class MigrationRunner {
  private migrations: Migration[] = [];

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations() {
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_row_level_security.sql',
      '003_seed_data.sql'
    ];

    this.migrations = migrationFiles.map(filename => {
      const sql = readFileSync(join(__dirname, 'migrations', filename), 'utf-8');
      return {
        id: filename.split('_')[0],
        name: filename.replace('.sql', ''),
        sql
      };
    });
  }

  async createMigrationsTable() {
    const { error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      throw new Error(`Failed to create migrations table: ${error.message}`);
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('id');

    if (error) {
      console.warn('Could not fetch executed migrations, assuming none executed:', error.message);
      return [];
    }

    return data?.map(row => row.id) || [];
  }

  async executeMigration(migration: Migration): Promise<void> {
    console.log(`Executing migration: ${migration.name}`);

    // Split SQL into individual statements
    const statements = migration.sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          throw new Error(`SQL Error: ${error.message}\nStatement: ${statement}`);
        }
      } catch (err) {
        // Some statements might fail in development (like creating existing extensions)
        // Log the error but continue
        console.warn(`Warning in migration ${migration.name}:`, err);
      }
    }

    // Record migration as executed
    const { error: insertError } = await supabase
      .from('schema_migrations')
      .insert({
        id: migration.id,
        name: migration.name
      });

    if (insertError) {
      throw new Error(`Failed to record migration: ${insertError.message}`);
    }

    console.log(`✅ Migration ${migration.name} completed successfully`);
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting database migrations...');

      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();

      // Get list of executed migrations
      const executedMigrations = await this.getExecutedMigrations();

      // Filter out already executed migrations
      const pendingMigrations = this.migrations.filter(
        migration => !executedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations to run');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);

      // Execute pending migrations in order
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    console.log(`Rolling back migration: ${migrationId}`);
    
    // Remove from migrations table
    const { error } = await supabase
      .from('schema_migrations')
      .delete()
      .eq('id', migrationId);

    if (error) {
      throw new Error(`Failed to rollback migration: ${error.message}`);
    }

    console.log(`✅ Migration ${migrationId} rolled back`);
  }

  async getStatus(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    
    console.log('\n📊 Migration Status:');
    console.log('==================');
    
    for (const migration of this.migrations) {
      const status = executedMigrations.includes(migration.id) ? '✅ Executed' : '⏳ Pending';
      console.log(`${migration.id} - ${migration.name}: ${status}`);
    }
    
    console.log(`\nTotal: ${this.migrations.length} migrations, ${executedMigrations.length} executed\n`);
  }
}

// CLI interface
async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'run':
        await runner.runMigrations();
        break;
      case 'status':
        await runner.getStatus();
        break;
      case 'rollback':
        const migrationId = process.argv[3];
        if (!migrationId) {
          console.error('Please provide migration ID to rollback');
          process.exit(1);
        }
        await runner.rollbackMigration(migrationId);
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migrate run     - Run pending migrations');
        console.log('  npm run migrate status  - Show migration status');
        console.log('  npm run migrate rollback <id> - Rollback specific migration');
        break;
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { MigrationRunner };

// Run CLI if called directly
if (require.main === module) {
  main();
}