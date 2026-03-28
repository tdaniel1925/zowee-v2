import { supabaseAdmin } from '@/lib/supabase'
import { IntentResult } from '@/lib/intents'

/**
 * Handle price monitoring requests
 */
export async function handleMonitorPrice(
  userId: string,
  intent: IntentResult,
  userMessage: string
): Promise<string> {
  const supabase = supabaseAdmin()
  const { entities } = intent

  const productName = entities.product_name || 'Unknown product'
  const targetPrice = entities.target_price || null

  // Create monitor in database
  const { data: monitor, error } = await supabase
    .from('zowee_monitors')
    .insert({
      user_id: userId,
      type: 'price',
      label: productName,
      target_product: productName,
      threshold: targetPrice ? parseFloat(targetPrice) : null,
      threshold_direction: 'below',
      status: 'active',
      check_frequency: 'daily',
      alert_channel: 'sms',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating monitor:', error)
    return `I had trouble setting up that monitor. Can you try again with the product name and target price?`
  }

  if (targetPrice) {
    return `✓ Watching ${productName}! I'll text you the moment it drops below $${targetPrice}.`
  } else {
    return `✓ Monitoring ${productName} for you. What price should I alert you at?`
  }
}

/**
 * Handle flight monitoring requests
 */
export async function handleMonitorFlight(
  userId: string,
  intent: IntentResult,
  userMessage: string
): Promise<string> {
  const supabase = supabaseAdmin()
  const { entities } = intent

  const origin = entities.origin || null
  const destination = entities.destination || null
  const targetPrice = entities.target_price || null

  // Create flight monitor
  const { data: monitor, error } = await supabase
    .from('zowee_monitors')
    .insert({
      user_id: userId,
      type: 'flight',
      origin: origin,
      destination: destination,
      label: `${origin || '?'} → ${destination || '?'}`,
      threshold: targetPrice ? parseFloat(targetPrice) : null,
      threshold_direction: 'below',
      status: 'active',
      check_frequency: 'daily',
      alert_channel: 'sms',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating flight monitor:', error)
    return `I had trouble setting up that flight monitor. Can you include origin, destination, and target price?`
  }

  if (origin && destination && targetPrice) {
    return `✓ Watching flights from ${origin} to ${destination}! I'll alert you when prices drop below $${targetPrice}.`
  } else {
    return `✓ Flight monitor started. To help me track this better, what's your origin, destination, and max price?`
  }
}
