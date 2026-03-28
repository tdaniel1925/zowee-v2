/**
 * Run Supabase migration
 * Run with: npx tsx scripts/run-migration.ts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function runMigration() {
  console.log('Running Supabase migration...\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✓ Connected to Supabase database\n')

    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_zowee_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Executing migration: 001_zowee_schema.sql')
    console.log('Creating all Zowee database tables...\n')

    // Execute the entire migration
    await client.query(migrationSQL)

    console.log('✓ Migration completed successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Created tables:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ✓ zowee_users')
    console.log('  ✓ zowee_memory')
    console.log('  ✓ zowee_conversations')
    console.log('  ✓ zowee_tasks')
    console.log('  ✓ zowee_reminders')
    console.log('  ✓ zowee_monitors')
    console.log('  ✓ zowee_monitor_log')
    console.log('  ✓ zowee_skills')
    console.log('  ✓ zowee_skill_suggestions')
    console.log('  ✓ zowee_events')
    console.log('  ✓ zowee_actions')
    console.log('  ✓ zowee_email_sends')
    console.log('  ✓ zowee_mlm_connectors')
    console.log('\n  ✓ RLS policies enabled')
    console.log('  ✓ Apex Affinity connector seeded')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error running migration:', error.message)
    }
    throw error
  } finally {
    await client.end()
  }
}

runMigration()
  .then(() => {
    console.log('✓ Migration instructions displayed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to run migration')
    process.exit(1)
  })
