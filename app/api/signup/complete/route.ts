import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendToApex } from '@/lib/apex/webhook'
import { provisionPhoneNumber, sendSMS } from '@/lib/twilio/provisioning'
import { isPlanVoiceEnabled } from '@/lib/vapi/provisioning'

let supabaseInstance: any = null
let stripeInstance: Stripe | null = null

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

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing env.STRIPE_SECRET_KEY')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    })
  }
  return stripeInstance
}

export async function POST(req: NextRequest) {
  console.log('[SIGNUP-COMPLETE] Starting post-checkout account setup')
  try {
    const body = await req.json()
    const { sessionId } = body

    if (!sessionId) {
      console.error('[SIGNUP-COMPLETE] Missing session_id')
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      )
    }

    // Retrieve Checkout Session from Stripe
    console.log('[SIGNUP-COMPLETE] Retrieving Checkout Session:', sessionId)
    let session: Stripe.Checkout.Session
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId, {
        expand: ['subscription', 'customer'],
      })
      console.log('[SIGNUP-COMPLETE] Session retrieved:', {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
      })
    } catch (stripeError: any) {
      console.error('[SIGNUP-COMPLETE] Failed to retrieve session:', stripeError.message)
      return NextResponse.json(
        { error: 'Invalid checkout session' },
        { status: 400 }
      )
    }

    // Verify payment was successful
    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      console.error('[SIGNUP-COMPLETE] Payment not completed:', session.payment_status)
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Get signup session ID from metadata
    const { signup_session_id, plan: metadataPlan } = session.metadata || {}
    if (!signup_session_id) {
      console.error('[SIGNUP-COMPLETE] Missing signup_session_id in metadata')
      return NextResponse.json(
        { error: 'Invalid session data - missing signup reference' },
        { status: 400 }
      )
    }

    // Retrieve signup session from secure storage
    console.log('[SIGNUP-COMPLETE] Retrieving signup session:', signup_session_id)
    const { data: signupSession, error: sessionError } = await getSupabase()
      .from('jordyn_signup_sessions')
      .select('*')
      .eq('id', signup_session_id)
      .single()

    if (sessionError || !signupSession) {
      console.error('[SIGNUP-COMPLETE] Failed to retrieve signup session:', sessionError)
      return NextResponse.json(
        { error: 'Signup session not found or expired' },
        { status: 400 }
      )
    }

    // Decode password from base64
    const password = Buffer.from(signupSession.password_hash, 'base64').toString('utf-8')
    const { name, email, phone, plan } = signupSession

    console.log('[SIGNUP-COMPLETE] Retrieved signup data for:', email)

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    console.log('[SIGNUP-COMPLETE] Processing signup for:', { name, phone: `+1${phone}`, email, plan })
    console.log('[SIGNUP-COMPLETE] Stripe IDs:', { customerId, subscriptionId })

    // Check if already completed (idempotent)
    console.log('[SIGNUP-COMPLETE] Checking if already completed')
    const { data: existingUser } = await getSupabase()
      .from('jordyn_users')
      .select('id, twilio_phone_number')
      .eq('stripe_customer_id', customerId)
      .single()

    if (existingUser) {
      console.log('[SIGNUP-COMPLETE] User already exists, returning existing data')
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          name,
          phone: `+1${phone}`,
          email,
          jordynNumber: existingUser.twilio_phone_number,
          plan,
        },
      })
    }

    // Create Supabase Auth user
    console.log('[SIGNUP-COMPLETE] Creating Supabase Auth user')
    const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone: `+1${phone}`,
      },
    })

    if (authError || !authData.user) {
      console.error('[SIGNUP-COMPLETE] Auth creation error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 500 }
      )
    }
    console.log('[SIGNUP-COMPLETE] Auth user created:', authData.user.id)

    // Get subscription for trial end date
    let trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    try {
      const subscription = await getStripe().subscriptions.retrieve(subscriptionId!)
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000)
      }
    } catch (subError) {
      console.error('[SIGNUP-COMPLETE] Error retrieving subscription:', subError)
      // Continue with default trial end
    }

    // Create user in jordyn_users table using SQL function to bypass schema cache
    console.log('[SIGNUP-COMPLETE] Creating user in database')
    const { data: newUserData, error: dbError } = await getSupabase()
      .rpc('create_jordyn_user_direct', {
        p_auth_user_id: authData.user.id,
        p_name: name,
        p_email: email,
        p_phone_number: `+1${phone}`,
        p_plan: plan,
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id: subscriptionId,
        p_trial_ends_at: trialEnd.toISOString(),
      })

    if (dbError) {
      console.error('[SIGNUP-COMPLETE] ===== DATABASE ERROR =====')
      console.error('[SIGNUP-COMPLETE] Error:', JSON.stringify(dbError, null, 2))
      console.error('[SIGNUP-COMPLETE] Error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
      })
      console.error('[SIGNUP-COMPLETE] ========================================')
      // Cleanup Auth user
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Database error: ${dbError.message || 'Failed to create account'}` },
        { status: 500 }
      )
    }

    // SQL function returns array, get first item
    const newUser = Array.isArray(newUserData) ? newUserData[0] : newUserData
    if (!newUser) {
      console.error('[SIGNUP-COMPLETE] No user data returned from database')
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }
    console.log('[SIGNUP-COMPLETE] User created in database:', newUser.id)

    // Provision Twilio phone number
    console.log('[SIGNUP-COMPLETE] Provisioning Twilio phone number')
    const phoneResult = await provisionPhoneNumber(newUser.id)

    if (!phoneResult.success || !phoneResult.phoneNumber) {
      console.error('[SIGNUP-COMPLETE] Phone provisioning failed:', phoneResult.error)
      // Cleanup - delete user and auth
      await getSupabase().from('jordyn_users').delete().eq('id', newUser.id)
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to provision phone number. Please contact support.' },
        { status: 500 }
      )
    }

    const jordynNumber = phoneResult.phoneNumber
    console.log(`[SIGNUP-COMPLETE] Provisioned Twilio phone number: ${jordynNumber}`)
    console.log(`[SIGNUP-COMPLETE] Number added to A2P campaign via Messaging Service: ${phoneResult.messagingServiceSid}`)

    // Provision VAPI voice agent if plan includes voice features
    if (isPlanVoiceEnabled(plan as any)) {
      console.log(`[SIGNUP-COMPLETE] Voice features enabled for ${plan} plan`)
      // VAPI voice agent provisioning will be added here
    }

    // Wait 30 seconds for Twilio number to fully activate
    console.log('[SIGNUP-COMPLETE] Waiting 30 seconds for number activation...')
    await new Promise(resolve => setTimeout(resolve, 30000))
    console.log('[SIGNUP-COMPLETE] Number activation complete')

    // Send welcome SMS
    const hasVoice = isPlanVoiceEnabled(plan as any)
    const welcomeMessage = hasVoice
      ? `Welcome to Jordyn! 🎉\n\nThis is YOUR personal AI assistant number!\n\nYou can text OR call THIS number:\n• Text: "Track PS5 prices under $450"\n• Call: Say "Book me a flight to NYC"\n• Smart Home: "Turn off bedroom lights"\n\nSave this number in your contacts as "My Jordyn Assistant"\n\n🏠 Want smart home control? Link your Alexa account at:\n${process.env.NEXT_PUBLIC_APP_URL}/account/integrations\n\nYour 7-day free trial starts now. Enjoy!\n\n- The Jordyn Team`
      : `Welcome to Jordyn! 🎉\n\nThis is YOUR personal AI assistant number!\n\nSave this number in your contacts and text it anything:\n• "Book me a flight to NYC next Friday"\n• "Track PS5 prices under $450"\n• "Find a sushi restaurant near me tonight"\n\n🏠 Want smart home control? Link your Alexa account at:\n${process.env.NEXT_PUBLIC_APP_URL}/account/integrations\n\nYour 7-day free trial starts now. Enjoy!\n\n- The Jordyn Team`

    console.log('[SIGNUP-COMPLETE] Sending welcome SMS...')
    console.log('[SIGNUP-COMPLETE] From:', jordynNumber)
    console.log('[SIGNUP-COMPLETE] To:', `+1${phone}`)
    console.log('[SIGNUP-COMPLETE] Message length:', welcomeMessage.length, 'characters')

    try {
      // Correct parameter order: sendSMS(to, message, from)
      await sendSMS(
        `+1${phone}`,      // TO: user's phone number
        welcomeMessage,     // MESSAGE: welcome text
        jordynNumber        // FROM: Jordyn number
      )
      console.log('[SIGNUP-COMPLETE] ✓ Welcome SMS sent successfully')
    } catch (smsError: any) {
      console.error('[SIGNUP-COMPLETE] ===== WELCOME SMS EXCEPTION =====')
      console.error('[SIGNUP-COMPLETE] Error:', smsError?.message)
      console.error('[SIGNUP-COMPLETE] Stack:', smsError?.stack)
      console.error('[SIGNUP-COMPLETE] ========================================')
      // Don't fail the signup if SMS fails
    }

    // Send customer data to Apex
    const planAmounts: Record<string, number> = {
      solo: 19,
      family: 34,
      solo_voice: 39,
      family_voice: 59,
      business: 97,
      test: 1,
    }

    try {
      await sendToApex(
        'customer.trial_start',
        {
          customer: {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone_number,
            jordyn_number: jordynNumber,
          },
          subscription: {
            plan: plan as any,
            amount: planAmounts[plan],
            status: 'trialing',
            trial_end: trialEnd.toISOString(),
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          },
        },
        newUser.id
      )
    } catch (apexError) {
      console.error('[SIGNUP-COMPLETE] Apex webhook error:', apexError)
      // Don't fail the signup if Apex webhook fails
    }

    // Mark signup session as completed
    await getSupabase()
      .from('jordyn_signup_sessions')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', signup_session_id)

    console.log('[SIGNUP-COMPLETE] Signup completed successfully for:', newUser.id)
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone_number,
        email: newUser.email,
        jordynNumber,
        plan,
        trialEnd: newUser.trial_ends_at,
      },
      // Return credentials for auto-login on client
      auth: {
        email,
        password, // Client will use this to sign in automatically
      },
    })
  } catch (error: any) {
    console.error('[SIGNUP-COMPLETE] ===== UNEXPECTED ERROR =====')
    console.error('[SIGNUP-COMPLETE] Error name:', error?.name)
    console.error('[SIGNUP-COMPLETE] Error message:', error?.message)
    console.error('[SIGNUP-COMPLETE] Error stack:', error?.stack)
    console.error('[SIGNUP-COMPLETE] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[SIGNUP-COMPLETE] ========================================')
    return NextResponse.json(
      { error: `Unexpected error: ${error?.message || 'Please contact support'}` },
      { status: 500 }
    )
  }
}
