import { NextRequest, NextResponse } from 'next/server'
import { validateTwilioSignature, sendSMS } from '@/lib/twilio-client'
import { supabaseAdmin } from '@/lib/supabase'
import { detectIntent, generateResponse } from '@/lib/intents'
import { handleMonitorPrice, handleMonitorFlight } from '@/lib/handlers/monitor-handler'
import { handleReminder } from '@/lib/handlers/reminder-handler'
import { handleFlightBooking, handleRestaurantBooking, handleHotelBooking } from '@/lib/handlers/booking-handler'

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    // 1. Get form data from Twilio
    const formData = await request.formData()
    const params: Record<string, any> = {}
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    const fromNumber = params.From as string
    const messageBody = params.Body as string
    const twilioSid = params.MessageSid as string

    // 2. Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature') || ''
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`

    const isValid = validateTwilioSignature(signature, url, params)
    if (!isValid) {
      console.error('Invalid Twilio signature')
      return new Response('Unauthorized', { status: 403 })
    }

    console.log(`📱 SMS from ${fromNumber}: ${messageBody}`)

    // 3. Find or create user
    let { data: user, error: userError } = await supabase
      .from('zowee_users')
      .select('*')
      .eq('phone_number', fromNumber)
      .single()

    if (!user) {
      console.log('Unknown user, creating new record')

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('zowee_users')
        .insert({
          name: 'New User',
          phone_number: fromNumber,
          plan: 'solo',
          plan_status: 'trialing',
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        await sendSMS(fromNumber, "Welcome to Zowee! We're setting up your account. Please try again in a moment.")
        return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
          headers: { 'Content-Type': 'text/xml' },
        })
      }

      user = newUser
    }

    // 4. Detect intent
    const intent = await detectIntent(messageBody)
    console.log(`🎯 Intent: ${intent.intent} (${intent.confidence}%)`)

    // 5. Route to appropriate handler based on intent
    let response: string

    switch (intent.intent) {
      case 'monitor_price':
        response = await handleMonitorPrice(user.id, intent, messageBody)
        break

      case 'monitor_flight':
        response = await handleMonitorFlight(user.id, intent, messageBody)
        break

      case 'reminder':
        response = await handleReminder(user.id, intent, messageBody)
        break

      case 'booking_flight':
        response = await handleFlightBooking(user.id, intent, messageBody)
        break

      case 'booking_restaurant':
        response = await handleRestaurantBooking(user.id, intent, messageBody)
        break

      case 'booking_hotel':
        response = await handleHotelBooking(user.id, intent, messageBody)
        break

      case 'help':
        response = `Hey ${user.name}! I can help you:\n\n📱 Book flights, hotels & restaurants\n💰 Monitor prices\n⏰ Set reminders\n🔍 Research topics\n\nJust text me what you need!`
        break

      case 'cancel':
        response = `To cancel your Zowee subscription, text CANCEL. Or visit your account dashboard to manage your plan. Need help with something else?`
        break

      case 'question':
      case 'research':
      case 'unknown':
      default:
        // Fall back to general Claude response
        response = await generateResponse(intent, messageBody, user.name, user.plan_status)
        break
    }

    // 6. Save conversation to database
    await supabase.from('zowee_conversations').insert({
      user_id: user.id,
      direction: 'inbound',
      message_in: messageBody,
      message_out: response,
      intent: intent.intent,
      twilio_sid: twilioSid,
      channel: 'sms',
    })

    // Update last interaction
    await supabase
      .from('zowee_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('id', user.id)

    // 7. Send SMS reply
    await sendSMS(fromNumber, response)

    console.log(`✅ Sent reply to ${fromNumber}: ${response}`)

    // 8. Return empty TwiML (we already sent the SMS)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  } catch (error) {
    console.error('Error processing SMS:', error)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/xml' },
      }
    )
  }
}
