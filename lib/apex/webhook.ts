import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null

const getSupabase = () => {
  if (!supabaseInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
    }
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseInstance
}

export type ApexEventType =
  | 'customer.signup'
  | 'customer.trial_start'
  | 'customer.trial_convert'
  | 'subscription.active'
  | 'subscription.cancelled'
  | 'subscription.plan_change'
  | 'subscription.renewed'

interface ApexWebhookPayload {
  event: ApexEventType
  timestamp: string
  customer: {
    id: string
    name: string
    phone: string
    email?: string
    pokkit_number?: string
  }
  subscription?: {
    plan: 'solo' | 'family'
    amount: number
    status: 'trialing' | 'active' | 'cancelled' | 'past_due'
    trial_end?: string
    stripe_customer_id?: string
    stripe_subscription_id?: string
  }
  referral?: {
    code?: string
    source?: string
  }
  metadata?: Record<string, any>
}

/**
 * Send event to Apex Affinity system
 * Logs all attempts to apex_webhook_log table
 */
export async function sendToApex(
  eventType: ApexEventType,
  payload: Omit<ApexWebhookPayload, 'event' | 'timestamp'>,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const apexUrl = process.env.APEX_WEBHOOK_URL
  const apexSecret = process.env.APEX_WEBHOOK_SECRET

  if (!apexUrl) {
    console.warn('APEX_WEBHOOK_URL not configured - skipping webhook')
    return { success: false, error: 'Apex webhook URL not configured' }
  }

  const fullPayload: ApexWebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    ...payload,
  }

  let responseStatus: number | null = null
  let responseBody: string | null = null
  let error: string | null = null
  let succeeded = false

  try {
    const response = await fetch(apexUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pokkit-Secret': apexSecret || '',
        'User-Agent': 'Pokkit/1.0',
      },
      body: JSON.stringify(fullPayload),
    })

    responseStatus = response.status
    responseBody = await response.text()
    succeeded = response.ok

    if (!response.ok) {
      error = `Apex returned ${response.status}: ${responseBody}`
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error sending to Apex'
    console.error('Error sending to Apex:', error)
  }

  // Log to database
  try {
    await getSupabase().from('apex_webhook_log').insert({
      event_type: eventType,
      user_id: userId || null,
      payload: fullPayload,
      response_status: responseStatus,
      response_body: responseBody,
      error,
      succeeded,
    })
  } catch (dbError) {
    console.error('Failed to log Apex webhook:', dbError)
  }

  return { success: succeeded, error: error || undefined }
}

/**
 * Retry failed webhook (called by cron or manually)
 */
export async function retryFailedWebhook(webhookLogId: string): Promise<boolean> {
  const { data: log } = await getSupabase()
    .from('apex_webhook_log')
    .select('*')
    .eq('id', webhookLogId)
    .single()

  if (!log || log.succeeded) {
    return false
  }

  const result = await sendToApex(
    log.event_type as ApexEventType,
    log.payload as any,
    log.user_id
  )

  // Update attempts count
  await getSupabase()
    .from('apex_webhook_log')
    .update({ attempts: log.attempts + 1 })
    .eq('id', webhookLogId)

  return result.success
}
