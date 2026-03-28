/**
 * Apply Database Migration 004
 * Adds voice features to the database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('🔧 Applying database migration 004...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '004_voice_plans_and_features.sql'
    )
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded')
    console.log('📊 Executing SQL statements...\n')

    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL,
    })

    if (error) {
      // If the RPC doesn't exist, we'll need to execute manually
      console.log('⚠️  RPC method not available, using alternative approach...\n')

      // Split migration into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'))

      console.log(`Found ${statements.length} SQL statements to execute\n`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.length > 0) {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          try {
            // For Supabase, we need to use the PostgREST API
            // This is a workaround - in production, you'd run this in the SQL editor
            console.log(`   ⚠️  Statement requires manual execution in Supabase SQL Editor`)
          } catch (stmtError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message)
          }
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⚠️  MANUAL MIGRATION REQUIRED\n')
      console.log('Please follow these steps:')
      console.log('1. Go to: https://supabase.com/dashboard/project/xxxtbzypheuiniuqynas/editor')
      console.log('2. Open the SQL Editor')
      console.log('3. Copy and paste the contents of:')
      console.log('   supabase/migrations/004_voice_plans_and_features.sql')
      console.log('4. Click "Run" to execute\n')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      // Let's at least verify the migration is needed by checking if columns exist
      console.log('🔍 Checking if migration is already applied...\n')

      const { data: columns, error: columnError } = await supabase.rpc('get_columns', {
        table_name: 'pokkit_users',
      })

      if (!columnError && columns) {
        const hasVoiceColumns = columns.some((col) => col.column_name === 'voice_enabled')
        if (hasVoiceColumns) {
          console.log('✅ Migration appears to already be applied!')
          console.log('   (voice_enabled column exists in pokkit_users)\n')
          return true
        }
      }

      // Check using a simple query
      const { data: testData, error: testError } = await supabase
        .from('pokkit_users')
        .select('voice_enabled')
        .limit(1)

      if (!testError) {
        console.log('✅ Migration appears to already be applied!')
        console.log('   (voice_enabled column exists in pokkit_users)\n')
        return true
      }

      return false
    }

    console.log('✅ Migration applied successfully!\n')
    return true
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    throw error
  }
}

// Verification queries
async function verifyMigration() {
  console.log('🔍 Verifying migration...\n')

  try {
    // Check if voice columns exist
    console.log('1️⃣  Checking voice columns in pokkit_users...')
    const { data: users, error: userError } = await supabase
      .from('pokkit_users')
      .select('voice_enabled, voice_minutes_used, voice_minutes_quota, voice_minutes_reset_at')
      .limit(1)

    if (userError) {
      console.log('   ❌ Voice columns not found')
      console.log('   → Migration needs to be applied manually\n')
      return false
    }
    console.log('   ✅ Voice columns exist\n')

    // Check if voice_calls table exists
    console.log('2️⃣  Checking pokkit_voice_calls table...')
    const { data: calls, error: callsError } = await supabase
      .from('pokkit_voice_calls')
      .select('id')
      .limit(1)

    if (callsError) {
      console.log('   ❌ pokkit_voice_calls table not found')
      console.log('   → Migration needs to be applied manually\n')
      return false
    }
    console.log('   ✅ pokkit_voice_calls table exists\n')

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ MIGRATION VERIFIED SUCCESSFULLY!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    return true
  } catch (error) {
    console.error('❌ Verification error:', error.message)
    return false
  }
}

// Run the migration
applyMigration()
  .then((success) => {
    return verifyMigration()
  })
  .then((verified) => {
    if (verified) {
      console.log('✅ Setup complete!')
      process.exit(0)
    } else {
      console.log('⚠️  Please apply migration manually in Supabase SQL Editor')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
