// Check zowee_users columns
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkColumns() {
  console.log('🔍 Checking zowee_users columns...\n')

  const { data, error } = await supabase
    .from('zowee_users')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No users in database yet')
    console.log('Creating a test query to check columns...')

    // Try to select specific columns to see what exists
    const testColumns = ['rep_code', 'mlm_connector']
    for (const col of testColumns) {
      const { error: colError } = await supabase
        .from('zowee_users')
        .select(col)
        .limit(1)

      if (colError) {
        console.log(`  ${col}: ❌ MISSING (already removed or never existed)`)
      } else {
        console.log(`  ${col}: ⚠️  EXISTS (needs to be removed by migration 002)`)
      }
    }
    return
  }

  const columns = Object.keys(data[0])
  console.log('Current columns:')
  columns.forEach(col => console.log(`  - ${col}`))

  console.log('\n📊 Migration 002 Status:')
  console.log(`  rep_code: ${columns.includes('rep_code') ? '⚠️  NEEDS REMOVAL' : '✅ ALREADY REMOVED'}`)
  console.log(`  mlm_connector: ${columns.includes('mlm_connector') ? '⚠️  NEEDS REMOVAL' : '✅ ALREADY REMOVED'}`)
}

checkColumns().catch(console.error)
