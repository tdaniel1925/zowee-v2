/**
 * Control Skills - Pause/Resume/Status commands
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { PokkitContext } from '@/lib/sms/context'
import { SMSIntent } from '@/lib/sms/parser'

export interface SkillResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Handle PAUSE_SERVICE intent
 */
export async function handlePause(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { duration } = intent.entities
  const { user } = context

  let pausedUntil: string | null = null

  if (duration) {
    pausedUntil = calculatePauseUntil(duration)
  }

  // Store pause state in user preferences
  const { error } = await supabase
    .from('pokkit_users')
    .update({
      preferences: {
        ...user.preferences,
        paused: true,
        paused_until: pausedUntil,
        paused_at: new Date().toISOString(),
      },
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error pausing service:', error)
    return {
      success: false,
      message: "I couldn't pause right now. Please try again.",
    }
  }

  const message = pausedUntil
    ? `Paused until ${new Date(pausedUntil).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}. Text RESUME to start earlier.`
    : "Paused. Text RESUME when you're ready, or tell me how long (e.g., '2 hours')."

  return {
    success: true,
    message,
  }
}

/**
 * Handle RESUME_SERVICE intent
 */
export async function handleResume(
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { user } = context

  // Clear pause state
  const { error } = await supabase
    .from('pokkit_users')
    .update({
      preferences: {
        ...user.preferences,
        paused: false,
        paused_until: null,
        paused_at: null,
      },
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error resuming service:', error)
    return {
      success: false,
      message: "I couldn't resume right now. Please try again.",
    }
  }

  return {
    success: true,
    message: "I'm back! What can I help you with?",
  }
}

/**
 * Handle CHECK_STATUS intent
 */
export async function handleStatus(context: PokkitContext): Promise<SkillResult> {
  const { user, activeMonitors, recentConversations } = context

  const isPaused = user.preferences?.paused || false
  const pausedUntil = user.preferences?.paused_until

  let message = `Status Report 📊\n\n`
  message += `Account: ${user.plan === 'solo' ? 'Solo' : 'Family'} Plan\n`
  message += `Status: ${isPaused ? '⏸️ Paused' : '✅ Active'}\n`

  if (isPaused && pausedUntil) {
    const resumeTime = new Date(pausedUntil).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    message += `Resumes at: ${resumeTime}\n`
  }

  message += `\n📡 Active Price Monitors: ${activeMonitors.length}\n`

  if (activeMonitors.length > 0) {
    activeMonitors.slice(0, 3).forEach((monitor) => {
      const productName = monitor.target_product || monitor.label || 'Item'
      message += `  • ${productName} < $${monitor.threshold}\n`
    })
    if (activeMonitors.length > 3) {
      message += `  ... and ${activeMonitors.length - 3} more\n`
    }
  }

  message += `\n💬 Last 24h: ${recentConversations.length} conversations\n`

  if (user.trial_ends_at) {
    const trialEnd = new Date(user.trial_ends_at)
    const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 0) {
      message += `\n⏰ Trial ends in ${daysLeft} days\n`
    }
  }

  return {
    success: true,
    message,
  }
}

/**
 * Calculate pause_until timestamp from duration string
 */
function calculatePauseUntil(duration: string): string {
  const now = new Date()

  // Parse duration (e.g., "2 hours", "30 minutes", "1 hour")
  const match = duration.match(/(\d+)\s*(hour|minute|min|hr)s?/i)
  if (!match) {
    // Default to 1 hour if can't parse
    now.setHours(now.getHours() + 1)
    return now.toISOString()
  }

  const amount = parseInt(match[1])
  const unit = match[2].toLowerCase()

  if (unit.startsWith('h')) {
    now.setHours(now.getHours() + amount)
  } else if (unit.startsWith('m')) {
    now.setMinutes(now.getMinutes() + amount)
  }

  return now.toISOString()
}
