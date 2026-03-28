/**
 * Check Supabase tables
 * Run with: npx tsx scripts/check-tables.ts
 */

import { Client } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL not found in .env.local')
  process.exit(1)
}

async function checkTables() {
  console.log('Checking Supabase database tables...\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✓ Connected to Supabase database\n')

    // Query to get all zowee tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'zowee_%'
      ORDER BY table_name;
    `)

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Existing Zowee Tables:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (result.rows.length === 0) {
      console.log('  No Zowee tables found.')
      console.log('  Migration needs to be run.\n')
    } else {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`)
      })
      console.log(`\n  Total: ${result.rows.length} tables\n`)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Check for MLM connector data
    try {
      const mlmResult = await client.query(`
        SELECT name, display_name, active
        FROM zowee_mlm_connectors;
      `)

      if (mlmResult.rows.length > 0) {
        console.log('MLM Connectors:')
        mlmResult.rows.forEach(row => {
          console.log(`  ✓ ${row.display_name} (${row.name}) - ${row.active ? 'Active' : 'Inactive'}`)
        })
        console.log('')
      }
    } catch (err) {
      // Table might not exist yet
      console.log('MLM Connectors: (table not found)\n')
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    }
    throw error
  } finally {
    await client.end()
  }
}

checkTables()
  .then(() => {
    console.log('✓ Database check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to check database')
    process.exit(1)
  })
