import { supabaseAdmin } from '@/lib/supabase'
import { IntentResult } from '@/lib/intents'

/**
 * Handle reminder requests
 */
export async function handleReminder(
  userId: string,
  intent: IntentResult,
  userMessage: string
): Promise<string> {
  const supabase = supabaseAdmin()
  const { entities } = intent

  const reminderText = entities.reminder_text || userMessage
  const reminderTime = entities.reminder_time || null

  // Parse reminder time (this is basic - would need better time parsing)
  let remindAt: Date | null = null

  if (reminderTime) {
    // Try to parse common formats
    // For now, just set a placeholder time
    remindAt = new Date()
    remindAt.setHours(remindAt.getHours() + 1) // Default to 1 hour from now
  }

  if (!remindAt) {
    return `I can set that reminder! When should I remind you? (e.g., "tomorrow at 9am", "in 2 hours", "Friday at 3pm")`
  }

  // Create reminder
  const { data: reminder, error } = await supabase
    .from('zowee_reminders')
    .insert({
      user_id: userId,
      title: reminderText,
      remind_at: remindAt.toISOString(),
      status: 'pending',
      channel: 'sms',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating reminder:', error)
    return `I had trouble creating that reminder. Can you try again?`
  }

  const timeStr = remindAt.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return `✓ Reminder set for ${timeStr}: "${reminderText}"`
}
