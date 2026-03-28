// Check Row Level Security status
const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function checkRLS() {
  console.log('🔍 Checking Row Level Security status...\n')

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()

    // Check which tables have RLS enabled
    const { rows: rlsTables } = await client.query(`
      SELECT
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)

    console.log('📊 RLS Status by Table:\n')
    rlsTables.forEach(table => {
      const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED'
      console.log(`  ${table.tablename.padEnd(30)} ${status}`)
    })

    // Check existing policies
    const { rows: policies } = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `)

    console.log('\n📋 Existing RLS Policies:\n')
    if (policies.length === 0) {
      console.log('  ⚠️  No policies found')
    } else {
      policies.forEach(policy => {
        console.log(`  Table: ${policy.tablename}`)
        console.log(`    Policy: ${policy.policyname}`)
        console.log(`    Command: ${policy.cmd}`)
        console.log(`    Roles: ${policy.roles}`)
        console.log(`    Using: ${policy.qual || '(none)'}`)
        console.log()
      })
    }

    // Critical tables that need RLS
    const criticalTables = [
      'pokkit_users',
      'pokkit_conversations',
      'pokkit_tasks',
      'apex_webhook_log'
    ]

    console.log('⚠️  Critical Security Check:\n')
    for (const tableName of criticalTables) {
      const table = rlsTables.find(t => t.tablename === tableName)
      if (!table) {
        console.log(`  ${tableName}: ❌ TABLE NOT FOUND`)
      } else if (!table.rowsecurity) {
        console.log(`  ${tableName}: ⚠️  RLS DISABLED (SECURITY RISK!)`)
      } else {
        const tablePolicies = policies.filter(p => p.tablename === tableName)
        if (tablePolicies.length === 0) {
          console.log(`  ${tableName}: ⚠️  RLS ENABLED BUT NO POLICIES (nobody can access)`)
        } else {
          console.log(`  ${tableName}: ✅ RLS enabled with ${tablePolicies.length} policy(ies)`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

checkRLS()
