/**
 * Twilio SMS Webhook for Jordyn
 * Receives inbound SMS, processes with Claude AI, and sends responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { parseSMSIntent } from '@/lib/sms/parser'
import { loadUserContext, saveConversation } from '@/lib/sms/context'
import { executeSkill } from '@/lib/skills/executor'

let twilioInstance: any = null

const getTwilio = () => {
  if (!twilioInstance) {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('Missing env.TWILIO_ACCOUNT_SID')
    }
    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Missing env.TWILIO_AUTH_TOKEN')
    }
    twilioInstance = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }
  return twilioInstance
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Parse Twilio webhook data
    const formData = await request.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const {
      From: fromPhone,
      To: toPhone,
      Body: messageBody,
      MessageSid: messageSid,
    } = params

    console.log(`📱 Jordyn SMS from ${fromPhone}: "${messageBody}"`)

    // 2. Validate Twilio signature (security)
    const signature = request.headers.get('x-twilio-signature') || ''
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`

    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      params
    )

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('❌ Invalid Twilio signature')
      return twilioResponse()
    }

    // 3. Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 4. Lookup user by phone number
    const { data: user, error: userError } = await supabase
      .from('jordyn_users')
      .select('*')
      .eq('phone_number', fromPhone)
      .single()

    if (userError || !user) {
      console.log('⚠️ Unknown user, sending welcome message')

      // Unknown user - send signup message
      await sendSMS(
        fromPhone,
        `Welcome to Jordyn! 🎉\n\nI'm your personal AI assistant, but I need you to sign up first.\n\nVisit ${process.env.NEXT_PUBLIC_APP_URL}/signup to get started!\n\nOnce you're signed up, I can help you with:\n• Finding flights & hotels\n• Tracking prices\n• Making reservations\n• Answering questions\n\n...and much more!`
      )

      return twilioResponse()
    }

    console.log(`✅ User found: ${user.name} (${user.id})`)

    // 5. Load user context
    const context = await loadUserContext(user.id, supabase)

    // Add the phone number user texted TO (for conversation threading)
    context.toPhone = toPhone
    console.log(`[SMS Webhook] toPhone value: ${toPhone}`)
    console.log(`[SMS Webhook] context.toPhone set to: ${context.toPhone}`)

    // 6. Parse intent with Claude AI
    const intent = await parseSMSIntent(messageBody, context)

    console.log(`🎯 Intent: ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`)

    // 7. Execute skill
    const result = await executeSkill(intent, context, supabase)

    console.log(`✅ Skill executed: ${result.success}`)

    // 8. Send SMS response
    if (result.message) {
      await sendSMS(fromPhone, result.message, toPhone)
      console.log(`📤 Response sent: ${result.message.substring(0, 100)}...`)
    }

    // 9. Save conversation to database
    const processingTime = Date.now() - startTime
    await saveConversation(
      user.id,
      messageBody,
      result.message,
      intent.intent,
      intent.intent,
      processingTime,
      messageSid,
      supabase
    )

    // 10. Update last interaction timestamp
    await supabase
      .from('jordyn_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', user.id)

    console.log(`✅ SMS processed in ${processingTime}ms`)

    return twilioResponse()
  } catch (error: unknown) {
    console.error('❌ Error processing SMS:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(
  to: string,
  body: string,
  from?: string
): Promise<void> {
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER!

  try {
    await getTwilio().messages.create({
      from: fromNumber,
      to,
      body,
    })
  } catch (error) {
    console.error('Error sending SMS:', error)
    throw error
  }
}

/**
 * Return empty TwiML response
 */
function twilioResponse(): NextResponse {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      headers: { 'Content-Type': 'text/xml' },
    }
  )
}
