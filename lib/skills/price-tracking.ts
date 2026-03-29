/**
 * Price Tracking Skill - Monitor product prices
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
 * Handle TRACK_PRICE intent - Create a new price monitor
 */
export async function handleTrackPrice(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { product, threshold, direction, url } = intent.entities
  const { user } = context

  if (!product || !threshold) {
    return {
      success: false,
      message:
        "I need a product and price threshold. Try: 'Track PS5 prices under $450'",
    }
  }

  // Check monitor limit based on plan
  const maxMonitors = user.plan === 'family' ? 10 : 5
  if (context.activeMonitors.length >= maxMonitors) {
    return {
      success: false,
      message: `You've reached your monitor limit (${maxMonitors}). ${
        user.plan === 'solo'
          ? 'Upgrade to Family for 10 monitors!'
          : 'Delete a monitor to add a new one.'
      }`,
    }
  }

  // Create monitor
  const { data: monitor, error } = await supabase
    .from('jordyn_monitors')
    .insert({
      user_id: user.id,
      type: 'price',
      label: product,
      target_product: product,
      target_url: url || null,
      threshold: threshold,
      threshold_direction: direction || 'below',
      threshold_unit: 'usd',
      alert_channel: 'sms',
      alert_frequency: 'once',
      status: 'active',
      check_frequency: 'daily',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating monitor:', error)
    return {
      success: false,
      message: "I couldn't create the price monitor. Please try again.",
    }
  }

  const directionText = direction === 'above' ? 'rises above' : 'drops below'

  return {
    success: true,
    message: `✅ Tracking ${product} prices! I'll text you when it ${directionText} $${threshold}. Check frequency: Daily`,
    data: { monitor },
  }
}

/**
 * Handle CHECK_MONITORS intent - List active monitors
 */
export async function handleCheckMonitors(context: PokkitContext): Promise<SkillResult> {
  const { activeMonitors, user } = context

  if (activeMonitors.length === 0) {
    return {
      success: true,
      message:
        "You don't have any active price monitors. Try: 'Track PS5 prices under $450'",
    }
  }

  const maxMonitors = user.plan === 'family' ? 10 : 5
  let message = `Active Price Monitors (${activeMonitors.length}/${maxMonitors}):\n\n`

  activeMonitors.forEach((monitor, index) => {
    const product = monitor.target_product || monitor.label
    const direction = monitor.threshold_direction === 'above' ? '>' : '<'
    const lastChecked = monitor.last_checked_at
      ? new Date(monitor.last_checked_at).toLocaleDateString()
      : 'Never'

    message += `${index + 1}. ${product} ${direction} $${monitor.threshold}\n`
    message += `   Last checked: ${lastChecked}\n`

    if (monitor.last_value) {
      message += `   Current: $${monitor.last_value}\n`
    }
    message += `\n`
  })

  message += `To stop tracking, reply: "Stop tracking [product name]"`

  return {
    success: true,
    message,
  }
}

/**
 * Handle STOP_TRACKING intent - Deactivate a monitor
 */
export async function handleStopTracking(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { product, monitor_id } = intent.entities
  const { activeMonitors, user } = context

  if (activeMonitors.length === 0) {
    return {
      success: true,
      message: "You don't have any active monitors to stop.",
    }
  }

  // Find monitor by product name or ID
  let monitorToStop = null

  if (monitor_id) {
    monitorToStop = activeMonitors.find((m) => m.id === monitor_id)
  } else if (product) {
    monitorToStop = activeMonitors.find((m) =>
      (m.target_product || m.label).toLowerCase().includes(product.toLowerCase())
    )
  } else {
    // If no specific product, stop the most recent one
    monitorToStop = activeMonitors[0]
  }

  if (!monitorToStop) {
    return {
      success: false,
      message: `I couldn't find a monitor for "${product}". Text "Check monitors" to see your list.`,
    }
  }

  // Deactivate monitor
  const { error } = await supabase
    .from('jordyn_monitors')
    .update({ status: 'stopped' })
    .eq('id', monitorToStop.id)

  if (error) {
    console.error('Error stopping monitor:', error)
    return {
      success: false,
      message: "I couldn't stop that monitor. Please try again.",
    }
  }

  const productName = monitorToStop.target_product || monitorToStop.label

  return {
    success: true,
    message: `✅ Stopped tracking ${productName}. I won't send alerts for this anymore.`,
  }
}
