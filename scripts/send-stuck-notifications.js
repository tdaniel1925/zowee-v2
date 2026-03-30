/**
 * Manually send SMS for completed but unnotified tasks
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const twilio = require('twilio')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function sendStuckNotifications() {
  console.log('📤 Sending stuck notifications...\n')

  // Get completed but unnotified tasks
  const { data: tasks, error } = await supabase
    .from('jordyn_browser_tasks')
    .select('*')
    .eq('status', 'completed')
    .is('notified_at', null)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!tasks || tasks.length === 0) {
    console.log('✓ No stuck tasks found')
    return
  }

  console.log(`Found ${tasks.length} stuck tasks\n`)

  for (const task of tasks) {
    try {
      console.log(`Processing task ${task.id}...`)

      // Get user phone
      const { data: user } = await supabase
        .from('jordyn_users')
        .select('phone_number, twilio_phone_number')
        .eq('id', task.user_id)
        .single()

      if (!user || !user.phone_number) {
        console.error(`  ✗ No phone number for user ${task.user_id}`)
        continue
      }

      // Determine FROM number (with fallbacks)
      const fromNumber =
        task.reply_to_number ||
        user.twilio_phone_number ||
        process.env.TWILIO_PHONE_NUMBER

      // Format message (simplified)
      let message = '✅ Research completed!\n\n'
      if (task.result && task.result.summary) {
        message += task.result.summary
      } else {
        message += 'Results are ready in your dashboard.'
      }

      console.log(`  Sending from ${fromNumber} to ${user.phone_number}`)

      // Send SMS
      await twilioClient.messages.create({
        from: fromNumber,
        to: user.phone_number,
        body: message,
      })

      // Mark as notified
      await supabase
        .from('jordyn_browser_tasks')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', task.id)

      console.log(`  ✓ Sent and marked as notified\n`)
    } catch (error) {
      console.error(`  ✗ Error:`, error.message, '\n')
    }
  }

  console.log('✅ Done!')
}

sendStuckNotifications().then(() => process.exit(0))
