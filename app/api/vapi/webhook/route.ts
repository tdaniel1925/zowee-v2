/**
 * VAPI Webhook Endpoint
 * Handles voice call events and function calls from VAPI
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { executeSkill } from '@/lib/skills/executor'
import { stripe } from '@/lib/stripe'

/**
 * Verify VAPI webhook signature
 */
function verifyVapiSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-vapi-signature')
  const secret = process.env.VAPI_WEBHOOK_SECRET

  if (!signature || !secret) {
    return false
  }

  // VAPI uses HMAC SHA256 for signatures
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * Get user ID from VAPI assistant ID
 */
async function getUserByAssistantId(assistantId: string) {
  const admin = supabaseAdmin()
  const { data, error } = await admin
    .from('pokkit_users')
    .select('*')
    .eq('vapi_assistant_id', assistantId)
    .single()

  if (error || !data) {
    throw new Error('User not found for assistant')
  }

  return data
}

/**
 * Handle assistant-request event
 * VAPI requests assistant config for incoming call
 */
async function handleAssistantRequest(call: any) {
  console.log('[VAPI] Assistant request for call:', call.id)

  // Return assistant configuration
  // This is already configured when we create the assistant
  return NextResponse.json({
    success: true,
  })
}

/**
 * Handle function-call event
 * User requested an action during call
 */
async function handleFunctionCall(call: any) {
  console.log('[VAPI] Function call:', call.message?.functionCall)

  const { functionCall } = call.message || {}
  if (!functionCall) {
    return NextResponse.json({
      error: 'No function call provided',
    })
  }

  try {
    // Get user from assistant ID
    const user = await getUserByAssistantId(call.assistant?.id)
    const admin = supabaseAdmin()

    // Map function call to intent
    const intentType = mapFunctionToIntent(functionCall.name)
    const params = functionCall.parameters || {}

    console.log(`[VAPI] Executing skill ${intentType} for user ${user.id}`)

    // Build context for skill execution
    const context = {
      user,
      message: functionCall.name,
      channel: 'voice' as const,
      activeMonitors: [],
      recentConversations: [],
      preferences: user.preferences || {},
      contacts: user.contacts || [],
    } as any

    // Build intent object
    const intent = {
      intent: intentType as any,
      confidence: 1.0,
      entities: params,
      requires_confirmation: false,
      is_urgent: false,
    }

    // Execute the skill (same as SMS)
    const result = await executeSkill(intent, context, admin)

    // Return result to VAPI (will be spoken to user)
    return NextResponse.json({
      result: result.message || 'Done!',
    })
  } catch (error) {
    console.error('[VAPI] Function call failed:', error)
    return NextResponse.json({
      result: 'Sorry, I encountered an error completing that request.',
    })
  }
}

/**
 * Handle call-started event
 * Call began - create log entry
 */
async function handleCallStarted(call: any) {
  console.log('[VAPI] Call started:', call.id)

  try {
    const user = await getUserByAssistantId(call.assistant?.id)

    // Create call log entry
    const admin = supabaseAdmin()
    await admin.from('pokkit_voice_calls').insert({
      user_id: user.id,
      call_sid: call.twilioCallSid || call.id,
      vapi_call_id: call.id,
      from_number: call.customer?.number || 'unknown',
      to_number: call.phoneNumber?.number || process.env.TWILIO_PHONE_NUMBER,
      status: 'in_progress',
      started_at: new Date(call.startedAt || Date.now()).toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[VAPI] Failed to log call start:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}

/**
 * Handle call-ended event
 * Call ended - update usage, save transcript
 */
async function handleCallEnded(call: any) {
  console.log('[VAPI] Call ended:', call.id)

  try {
    const user = await getUserByAssistantId(call.assistant?.id)
    const admin = supabaseAdmin()

    // Calculate duration and minutes used
    const startedAt = new Date(call.startedAt).getTime()
    const endedAt = new Date(call.endedAt).getTime()
    const durationSeconds = Math.floor((endedAt - startedAt) / 1000)
    const minutesUsed = Math.ceil(durationSeconds / 60)

    // Update user's voice minutes
    const newUsed = (user.voice_minutes_used || 0) + minutesUsed
    const overageMinutes = Math.max(0, newUsed - (user.voice_minutes_quota || 0))
    const overageCost = overageMinutes * 0.50 // $0.50 per minute overage

    await admin
      .from('pokkit_users')
      .update({ voice_minutes_used: newUsed })
      .eq('id', user.id)

    // Update call log
    await admin
      .from('pokkit_voice_calls')
      .update({
        duration_seconds: durationSeconds,
        minutes_used: minutesUsed,
        cost: overageCost,
        transcript: call.transcript || null,
        summary: call.analysis?.summary || null,
        status: 'completed',
        ended_at: new Date(call.endedAt).toISOString(),
      })
      .eq('vapi_call_id', call.id)

    // If there's overage, charge the user
    if (overageCost > 0 && user.stripe_customer_id) {
      console.log(`[VAPI] Charging overage: $${overageCost} for ${overageMinutes} minutes`)

      const stripeClient = stripe()
      await stripeClient.invoiceItems.create({
        customer: user.stripe_customer_id,
        amount: Math.round(overageCost * 100), // Convert to cents
        currency: 'usd',
        description: `Voice overage: ${overageMinutes} minutes @ $0.50/min`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[VAPI] Failed to log call end:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}

/**
 * Handle transcript event
 * Real-time transcript chunk (optional)
 */
async function handleTranscript(call: any) {
  // For now, we'll just log it
  // In the future, we could store real-time transcripts
  console.log('[VAPI] Transcript chunk:', call.transcript?.slice(0, 100))
  return NextResponse.json({ success: true })
}

/**
 * Map VAPI function names to our intent system
 */
function mapFunctionToIntent(functionName: string): string {
  const mapping: Record<string, string> = {
    get_help: 'HELP',
    track_price: 'PRICE_TRACKING',
    search_youtube: 'YOUTUBE_SEARCH',
    control_smart_home: 'SMART_HOME_CONTROL',
    pause_service: 'CONTROL_PAUSE',
    resume_service: 'CONTROL_RESUME',
    compare_prices: 'RESEARCH_PRICES',
    read_reviews: 'RESEARCH_REVIEWS',
    fill_form: 'FORM_FILLING',
    make_payment: 'PAYMENT_PROCESSING',
  }

  return mapping[functionName] || 'GENERAL_CONVERSATION'
}

/**
 * Main webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()

    // Verify webhook signature
    if (!verifyVapiSignature(request, bodyText)) {
      console.error('[VAPI] Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(bodyText)
    const { type, call } = body

    console.log(`[VAPI] Webhook event: ${type}`)

    // Route to appropriate handler
    switch (type) {
      case 'assistant-request':
        return await handleAssistantRequest(call)

      case 'function-call':
        return await handleFunctionCall(call)

      case 'call-started':
        return await handleCallStarted(call)

      case 'call-ended':
        return await handleCallEnded(call)

      case 'transcript':
        return await handleTranscript(call)

      default:
        console.log(`[VAPI] Unknown event type: ${type}`)
        return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('[VAPI] Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
