/**
 * Check if reply_to_number column exists in jordyn_browser_tasks table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkColumn() {
  // Try to select the column
  const { data, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('id, reply_to_number')
    .limit(1)

  if (error) {
    if (error.message.includes('reply_to_number')) {
      console.log('❌ Column reply_to_number does NOT exist in jordyn_browser_tasks')
      console.log('\nYou need to add it manually in Supabase SQL Editor:')
      console.log('\nALTER TABLE jordyn_browser_tasks')
      console.log('ADD COLUMN IF NOT EXISTS reply_to_number TEXT;')
      return false
    } else {
      console.error('Error checking column:', error)
      return false
    }
  }

  console.log('✅ Column reply_to_number EXISTS in jordyn_browser_tasks')

  if (data && data.length > 0) {
    console.log(`Sample value: ${data[0].reply_to_number || 'NULL'}`)
  }

  return true
}

checkColumn().then((exists) => {
  process.exit(exists ? 0 : 1)
})
