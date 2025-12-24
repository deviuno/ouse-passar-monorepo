/**
 * Migration Runner Script
 * Executes pending SQL migrations against Supabase
 *
 * Usage: node scripts/run-migrations.js
 *
 * Note: This uses direct SQL execution. Make sure you have the service role key.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Error: Missing VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('\n💡 Alternative: Use Supabase Dashboard SQL Editor');
  console.error('   1. Go to: https://app.supabase.com/project/avlttxzppcywybiaxxzd/sql');
  console.error('   2. Create a new query');
  console.error('   3. Copy and paste SQL from: packages/site/supabase/migrations/');
  console.error('   4. Run each migration file in order');
  process.exit(1);
}

// Migrations to run (in order)
const migrations = [
  '023_create_legal_texts_table.sql',
  '024_add_show_answers_to_user_profiles.sql',
];

async function runMigration(filename) {
  console.log(`\n📝 Running migration: ${filename}`);

  try {
    const migrationPath = join(__dirname, '../supabase/migrations', filename);
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('   Executing SQL...');

    // Execute SQL directly using fetch to Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error in ${filename}:`, errorText);
      return false;
    }

    console.log(`✅ Successfully executed ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');
  console.log(`📍 Database: ${supabaseUrl}`);
  console.log('\n⚠️  RECOMMENDED: Use Supabase Dashboard for migrations');
  console.log('   This script may not work if exec_sql function is not available.');
  console.log('   Use Dashboard SQL Editor for guaranteed success.\n');

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed.');
    console.log('\n💡 Please use Supabase Dashboard instead:');
    console.log('   1. Go to: https://app.supabase.com/project/avlttxzppcywybiaxxzd/sql');
    console.log('   2. Click "New Query"');
    console.log('   3. Copy SQL from each migration file and run:');
    migrations.forEach(m => console.log(`      - ${m}`));
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  console.error('\n💡 Please use Supabase Dashboard SQL Editor instead.');
  process.exit(1);
});
