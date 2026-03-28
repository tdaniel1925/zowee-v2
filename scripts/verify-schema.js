// Verify database schema matches migrations
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    // Check pokkit_users columns
    const { rows: userColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'pokkit_users'
      ORDER BY ordinal_position;
    `)

    console.log('📊 pokkit_users columns:\n')
    userColumns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)'
      const defaultVal = col.column_default ? ` = ${col.column_default}` : ''
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`)
    })

    // Check apex_webhook_log columns
    const { rows: apexColumns } = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'apex_webhook_log'
      ORDER BY ordinal_position;
    `)

    console.log('\n📊 apex_webhook_log columns:\n')
    if (apexColumns.length === 0) {
      console.log('  ❌ Table not found')
    } else {
      apexColumns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)'
        const defaultVal = col.column_default ? ` = ${col.column_default}` : ''
        console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable}${defaultVal}`)
      })
    }

    // Check for required Pokkit tables
    const requiredTables = [
      'pokkit_users',
      'pokkit_conversations',
      'pokkit_tasks',
      'pokkit_memory',
      'pokkit_reminders',
      'pokkit_monitors',
      'apex_webhook_log'
    ]

    console.log('\n✅ Required Tables Check:\n')
    for (const tableName of requiredTables) {
      const { rows } = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName])

      if (rows.length > 0) {
        console.log(`  ${tableName.padEnd(30)} ✅ EXISTS`)
      } else {
        console.log(`  ${tableName.padEnd(30)} ❌ MISSING`)
      }
    }

    // Verify MLM tables removed
    console.log('\n🗑️  MLM Tables (should be removed):\n')
    const { rows: mlmTable } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pokkit_mlm_connectors'
    `)
    if (mlmTable.length === 0) {
      console.log('  pokkit_mlm_connectors         ✅ REMOVED')
    } else {
      console.log('  pokkit_mlm_connectors         ⚠️  STILL EXISTS (should be dropped)')
    }

    console.log('\n✨ Schema verification complete!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

verifySchema()
