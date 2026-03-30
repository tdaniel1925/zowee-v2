/**
 * Check details of the most recent task
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLatestTask() {
  const { data: task, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!task) {
    console.log('No tasks found')
    return
  }

  console.log('📋 Most Recent Task:\n')
  console.log(`ID: ${task.id}`)
  console.log(`Status: ${task.status}`)
  console.log(`Type: ${task.task_type}`)
  console.log(`Created: ${new Date(task.created_at).toLocaleString()}`)
  console.log(`\nIntent: ${task.intent?.intent}`)
  console.log(`\nEntities extracted by Claude:`)
  console.log(JSON.stringify(task.intent?.entities, null, 2))
  console.log(`\nReply to number: ${task.reply_to_number || 'NOT SET'}`)
  console.log(`\nNotified at: ${task.notified_at || 'NOT NOTIFIED'}`)
  console.log(`\nInstructions (first 500 chars):`)
  console.log(task.instructions.substring(0, 500))

  // Get user info
  const { data: user } = await supabase
    .from('jordyn_users')
    .select('phone_number, twilio_phone_number')
    .eq('id', task.user_id)
    .single()

  if (user) {
    console.log(`\nUser phone: ${user.phone_number}`)
    console.log(`User's Jordyn number: ${user.twilio_phone_number}`)
  }
}

checkLatestTask().then(() => process.exit(0))
