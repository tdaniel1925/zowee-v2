/**
 * Browser Task Result Poller
 * Polls for completed browser tasks and sends SMS notifications to users
 * Runs as a cron job (Vercel Cron)
 */

import { createClient } from '@supabase/supabase-js'
import { getUnnotifiedCompletedTasks, markTaskNotified } from './session'
import { formatResearchResults } from '@/lib/skills/browserbase-research'
import { formatFormResults } from '@/lib/skills/browserbase-forms'
import { formatPaymentReceipt } from '@/lib/skills/browserbase-payments'
import { sendSMS } from '@/lib/twilio'

/**
 * Poll for completed tasks and notify users via SMS
 * This should be called by a cron job every 1-2 minutes
 */
export async function pollCompletedTasks(): Promise<{ notified: number; errors: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  try {
    // Get completed tasks that haven't been notified yet
    const tasks = await getUnnotifiedCompletedTasks(supabase, 20)

    console.log(`[Browser Task Poller] Found ${tasks.length} completed tasks to notify`)

    let notified = 0
    let errors = 0

    for (const task of tasks) {
      try {
        console.log(`[Browser Task Poller] Processing task ${task.id}`)
        console.log(`[Browser Task Poller] Task type: ${task.task_type}`)
        console.log(`[Browser Task Poller] Task result:`, JSON.stringify(task.result).substring(0, 500))

        // Format message based on task type
        const message = formatTaskResult(task)

        console.log(`[Browser Task Poller] Formatted message (${message.length} chars):`, message.substring(0, 200))

        // Get user phone numbers (both their number and Jordyn's number)
        const { data: user } = await supabase
          .from('jordyn_users')
          .select('phone_number, twilio_phone_number')
          .eq('id', task.user_id)
          .single()

        if (!user?.phone_number) {
          console.error(`[Browser Task Poller] User ${task.user_id} has no phone_number`)
          errors++
          continue
        }

        // Use user's individual Jordyn number if available, otherwise fall back to main number
        const fromNumber = user.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER!

        console.log(
          `[Browser Task Poller] Sending SMS from ${fromNumber} to ${user.phone_number}`
        )

        // Send SMS from user's Jordyn number
        await sendSMS(user.phone_number, message, fromNumber)

        // Mark as notified
        await markTaskNotified(task.id, supabase)

        notified++

        console.log(`[Browser Task Poller] ✓ Notified user ${task.user_id} about task ${task.id}`)
      } catch (error) {
        console.error(`[Browser Task Poller] Error notifying task ${task.id}:`, error)
        errors++
      }
    }

    return { notified, errors }
  } catch (error) {
    console.error('[Browser Task Poller] Fatal error:', error)
    return { notified: 0, errors: 1 }
  }
}

/**
 * Format task result for SMS based on task type
 */
function formatTaskResult(task: any): string {
  switch (task.task_type) {
    case 'research':
      return formatResearchResults(task)

    case 'form_fill':
      return formatFormResults(task)

    case 'payment':
      return formatPaymentReceipt(task)

    case 'flight_search':
    case 'hotel_search':
    case 'restaurant_search':
      // Generic fallback for travel tasks
      return formatGenericResult(task)

    default:
      return formatGenericResult(task)
  }
}

/**
 * Generic result formatter for unsupported task types
 */
function formatGenericResult(task: any): string {
  if (task.error) {
    return `❌ Task failed: ${task.error}`
  }

  if (!task.result) {
    return '✅ Task completed but no results available.'
  }

  let message = `✅ Task completed!\n\n`

  if (task.result.summary) {
    message += task.result.summary
  } else if (typeof task.result === 'string') {
    message += task.result
  } else {
    message += 'Results available in your account dashboard.'
  }

  // Truncate if too long
  if (message.length > 600) {
    message = message.substring(0, 597) + '...'
  }

  return message
}

/**
 * Check for failed tasks and optionally notify users
 * This can be called less frequently than completed tasks
 */
export async function pollFailedTasks(): Promise<{ notified: number; errors: number }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  try {
    // Get failed tasks from last 10 minutes that haven't been notified
    const tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

    const { data: tasks } = await supabase
      .from('jordyn_browser_tasks')
      .select('*, jordyn_users(phone_number)')
      .eq('status', 'failed')
      .is('notified_at', null)
      .gte('updated_at', tenMinutesAgo.toISOString())
      .order('updated_at', { ascending: true })
      .limit(20)

    if (!tasks || tasks.length === 0) {
      return { notified: 0, errors: 0 }
    }

    console.log(`[Browser Task Poller] Found ${tasks.length} failed tasks to notify`)

    let notified = 0
    let errors = 0

    for (const task of tasks) {
      try {
        const user = (task as any).jordyn_users

        if (!user?.phone) {
          console.error(`[Browser Task Poller] User ${task.user_id} has no phone number`)
          errors++
          continue
        }

        // Format error message
        const message = task.error
          ? `❌ Task failed: ${task.error}\n\nPlease try again or let me know if you need help!`
          : `❌ Task failed due to an unknown error. Please try again!`

        // Send SMS
        await sendSMS(user.phone, message)

        // Mark as notified
        await markTaskNotified(task.id, supabase)

        notified++

        console.log(`[Browser Task Poller] Notified user ${task.user_id} about failed task ${task.id}`)
      } catch (error) {
        console.error(`[Browser Task Poller] Error notifying failed task ${task.id}:`, error)
        errors++
      }
    }

    return { notified, errors }
  } catch (error) {
    console.error('[Browser Task Poller] Fatal error in pollFailedTasks:', error)
    return { notified: 0, errors: 1 }
  }
}
