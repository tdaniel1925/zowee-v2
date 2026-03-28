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
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/001_pokkit_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Executing migration: 001_pokkit_schema.sql')
    console.log('Creating all Pokkit database tables...\n')

    // Execute the entire migration
    await client.query(migrationSQL)

    console.log('✓ Migration completed successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Created tables:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ✓ pokkit_users')
    console.log('  ✓ pokkit_memory')
    console.log('  ✓ pokkit_conversations')
    console.log('  ✓ pokkit_tasks')
    console.log('  ✓ pokkit_reminders')
    console.log('  ✓ pokkit_monitors')
    console.log('  ✓ pokkit_monitor_log')
    console.log('  ✓ pokkit_skills')
    console.log('  ✓ pokkit_skill_suggestions')
    console.log('  ✓ pokkit_events')
    console.log('  ✓ pokkit_actions')
    console.log('  ✓ pokkit_email_sends')
    console.log('  ✓ pokkit_mlm_connectors')
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
