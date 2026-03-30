/**
 * Run SQL migration directly on database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  // Read migration file
  const sql = fs.readFileSync(
    './supabase/migrations/013_add_reply_to_number.sql',
    'utf8'
  )

  console.log('Running migration: 013_add_reply_to_number.sql')
  console.log(sql)

  // Execute SQL
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    // If exec_sql function doesn't exist, try direct query
    console.log('Trying direct query...')
    const { data: result, error: queryError } = await supabase
      .from('_sql')
      .select('*')
      .eq('query', sql)

    if (queryError) {
      console.error('Error:', queryError)
      // Fallback: use the admin API
      console.log('Using admin API...')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: sql }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error('Migration failed:', error)
        console.log('\n❌ Could not run migration automatically')
        console.log('Please run this SQL manually in Supabase SQL Editor:')
        console.log(sql)
        process.exit(1)
      }
    }
  }

  console.log('✅ Migration completed successfully')
}

runMigration().then(() => process.exit(0))
