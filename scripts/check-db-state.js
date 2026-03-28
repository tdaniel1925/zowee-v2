// Check current database state
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n')

  // Check which tables exist
  const { data: tables, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `
  })

  if (error) {
    // Try direct query instead
    const { data: users } = await supabase.from('zowee_users').select('id').limit(1)
    const { data: apex } = await supabase.from('apex_webhook_log').select('id').limit(1)

    console.log('📋 Table Status:')
    console.log(`  zowee_users: ${users !== null ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`  apex_webhook_log: ${apex !== null ? '✅ EXISTS' : '❌ MISSING'}`)

    // Check for MLM columns in zowee_users
    const { data: userSample, error: userError } = await supabase
      .from('zowee_users')
      .select('*')
      .limit(1)

    if (userSample && userSample[0]) {
      const columns = Object.keys(userSample[0])
      console.log('\n📊 zowee_users columns:')
      console.log(`  rep_code: ${columns.includes('rep_code') ? '⚠️  EXISTS (needs migration 002)' : '✅ REMOVED'}`)
      console.log(`  mlm_connector: ${columns.includes('mlm_connector') ? '⚠️  EXISTS (needs migration 002)' : '✅ REMOVED'}`)
    }

    return
  }

  console.log('Tables found:')
  tables?.forEach(t => console.log(`  - ${t.table_name}`))
}

checkDatabaseState().catch(console.error)
