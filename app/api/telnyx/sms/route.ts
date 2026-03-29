/**
 * Telnyx SMS Webhook
 * Receives inbound SMS, processes with Claude AI, and sends responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseSMSIntent } from '@/lib/sms/parser'
import { loadUserContext, saveConversation } from '@/lib/sms/context'
import { executeSkill } from '@/lib/skills/executor'
import { sendSMS } from '@/lib/telnyx/provisioning'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Parse Telnyx webhook data
    const body = await request.json()
    const { data } = body

    // Handle different event types
    if (body.event_type === 'message.received') {
      const {
        from,
        to,
        text,
        id: messageSid,
      } = data.payload

      console.log(`📱 Pokkit SMS from ${from.phone_number} to ${to[0].phone_number}: "${text}"`)

      // 2. Create Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: { persistSession: false },
        }
      )

      // 3. Find user by their Telnyx phone number (the number that RECEIVED the message)
      const { data: user, error: userError } = await supabase
        .from('jordyn_users')
        .select('*')
        .eq('telnyx_phone_number', to[0].phone_number)
        .single()

      if (userError || !user) {
        console.log('⚠️ Unknown user, no Pokkit number matches')

        // Send welcome message
        const welcomeMessage = `Welcome to Pokkit! 🎉\n\nI'm your personal AI assistant, but I need you to sign up first.\n\nVisit ${process.env.NEXT_PUBLIC_APP_URL}/signup to get started!\n\nOnce you're signed up, I can help you with:\n• Finding flights & hotels\n• Tracking prices\n• Making reservations\n• Answering questions\n\n...and much more!`

        // Note: We can't send from user's number since they don't have one yet
        // This would need a company-wide number or skip the response
        console.log('⚠️ Cannot send welcome SMS - user not registered')

        return NextResponse.json({ success: true, message: 'User not found' })
      }

      // 4. Load user context
      const context = await loadUserContext(user.id, text, 'sms', supabase)

      // 5. Parse intent with Claude
      const intent = await parseSMSIntent(text, context)

      console.log(`🤖 Intent: ${intent.intent} (${intent.confidence})`)

      // 6. Execute skill
      const result = await executeSkill(intent, context, supabase)

      // 7. Send response SMS
      const replySuccess = await sendSMS(
        to[0].phone_number, // From user's Pokkit number
        from.phone_number,  // To user's personal phone
        result.message
      )

      if (!replySuccess.success) {
        console.error('❌ Failed to send SMS reply:', replySuccess.error)
      }

      // 8. Save conversation
      await saveConversation(
        user.id,
        text,
        result.message,
        intent.intent,
        supabase
      )

      const duration = Date.now() - startTime
      console.log(`✅ SMS processed in ${duration}ms`)

      return NextResponse.json({
        success: true,
        intent: intent.intent,
        response: result.message,
        duration,
      })
    }

    // Handle other event types
    return NextResponse.json({ success: true, message: 'Event ignored' })
  } catch (error) {
    console.error('❌ Error processing SMS:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
