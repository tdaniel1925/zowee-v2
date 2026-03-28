// Apply migration 002 to Supabase using direct PostgreSQL connection
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

async function applyMigration() {
  console.log('🚀 Applying migration 002 to Supabase...\n')

  // Connect to database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/002_remove_mlm_add_apex_webhook.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Executing migration SQL...\n')

    // Execute the entire migration as a single transaction
    await client.query('BEGIN')

    try {
      // Execute the migration
      await client.query(sql)

      await client.query('COMMIT')
      console.log('✅ Migration executed successfully!\n')

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }

    // Verify migration
    console.log('🔍 Verifying migration...\n')

    // Check apex_webhook_log exists
    const { rows: tables } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'apex_webhook_log'
    `)
    if (tables.length > 0) {
      console.log('✅ apex_webhook_log table: EXISTS')
    } else {
      console.log('❌ apex_webhook_log table: MISSING')
    }

    // Check MLM columns removed
    const { rows: repCodeCol } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'zowee_users' AND column_name = 'rep_code'
    `)
    if (repCodeCol.length === 0) {
      console.log('✅ rep_code column: REMOVED')
    } else {
      console.log('⚠️  rep_code column: STILL EXISTS')
    }

    const { rows: mlmCol } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'zowee_users' AND column_name = 'mlm_connector'
    `)
    if (mlmCol.length === 0) {
      console.log('✅ mlm_connector column: REMOVED')
    } else {
      console.log('⚠️  mlm_connector column: STILL EXISTS')
    }

    // Check zowee_mlm_connectors table dropped
    const { rows: mlmTable } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'zowee_mlm_connectors'
    `)
    if (mlmTable.length === 0) {
      console.log('✅ zowee_mlm_connectors table: DROPPED')
    } else {
      console.log('⚠️  zowee_mlm_connectors table: STILL EXISTS')
    }

    console.log('\n✨ Migration 002 complete!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyMigration()
