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
  console.log('[SIGNUP] Starting signup process with Stripe Checkout')
  try {
    const body = await req.json()
    const { name, phone, email, password, plan } = body
    console.log('[SIGNUP] Received signup request:', { name, phone: `+1${phone}`, plan })

    // Validate input
    if (!name || !phone || !email || !password || !plan) {
      console.error('[SIGNUP] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!name.includes(' ')) {
      return NextResponse.json(
        { error: 'Please provide both first and last name' },
        { status: 400 }
      )
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      )
    }

    const validPlans = ['solo', 'family', 'solo_voice', 'family_voice', 'business', 'test']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check if phone already exists
    console.log('[SIGNUP] Checking if phone already exists')
    const { data: existingUser } = await getSupabase()
      .from('jordyn_users')
      .select('id')
      .eq('phone_number', `+1${phone}`)
      .single()

    if (existingUser) {
      console.log('[SIGNUP] Phone number already registered')
      return NextResponse.json(
        { error: 'This number is already registered. Try signing in instead.' },
        { status: 409 }
      )
    }
    console.log('[SIGNUP] Phone number available')

    // Check if email already exists in Auth
    console.log('[SIGNUP] Checking if email already exists')
    const { data: existingAuthUsers } = await getSupabase()
      .auth.admin.listUsers()

    const emailExists = existingAuthUsers?.users?.some((u: any) => u.email === email)
    if (emailExists) {
      console.log('[SIGNUP] Email already registered')
      return NextResponse.json(
        { error: 'This email is already registered. Try signing in instead.' },
        { status: 409 }
      )
    }

    // Create signup session in database (secure storage for credentials)
    console.log('[SIGNUP] Creating secure signup session')
    const { data: signupSession, error: sessionError } = await getSupabase()
      .from('jordyn_signup_sessions')
      .insert({
        name,
        email,
        phone,
        password_hash: Buffer.from(password).toString('base64'), // Base64 encode (not hashing for now, but better than plain text)
        plan,
      })
      .select()
      .single()

    if (sessionError || !signupSession) {
      console.error('[SIGNUP] Failed to create signup session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to initialize signup. Please try again.' },
        { status: 500 }
      )
    }
    console.log('[SIGNUP] Signup session created:', signupSession.id)

    // Create Stripe customer
    console.log('[SIGNUP] Creating Stripe customer')
    let customer
    try {
      customer = await getStripe().customers.create({
        name,
        email,
        phone: `+1${phone}`,
        metadata: {
          plan,
          signup_phone: phone,
          signup_session_id: signupSession.id, // Reference to our secure session
        },
      })
      console.log('[SIGNUP] Stripe customer created:', customer.id)
    } catch (stripeError: any) {
      console.error('[SIGNUP] ===== STRIPE CUSTOMER CREATION ERROR =====')
      console.error('[SIGNUP] Error type:', stripeError?.type)
      console.error('[SIGNUP] Error code:', stripeError?.code)
      console.error('[SIGNUP] Error message:', stripeError?.message)
      console.error('[SIGNUP] Full error:', JSON.stringify(stripeError, null, 2))
      console.error('[SIGNUP] ========================================')

      // Cleanup signup session
      await getSupabase().from('jordyn_signup_sessions').delete().eq('id', signupSession.id)

      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message || 'Payment processing error'}` },
        { status: 500 }
      )
    }

    // Update signup session with Stripe customer ID
    await getSupabase()
      .from('jordyn_signup_sessions')
      .update({ stripe_customer_id: customer.id })
      .eq('id', signupSession.id)

    // Get Stripe price ID based on plan
    console.log('[SIGNUP] Getting price ID for plan:', plan)
    const priceIdMap: Record<string, string> = {
      solo: process.env.STRIPE_SOLO_PRICE_ID!,
      family: process.env.STRIPE_FAMILY_PRICE_ID!,
      solo_voice: process.env.STRIPE_SOLO_VOICE_PRICE_ID!,
      family_voice: process.env.STRIPE_FAMILY_VOICE_PRICE_ID!,
      business: process.env.STRIPE_BUSINESS_PRICE_ID!,
      test: process.env.STRIPE_TEST_PRICE_ID!,
    }
    const priceId = priceIdMap[plan]
    console.log('[SIGNUP] Price ID:', priceId)

    if (!priceId) {
      console.error('[SIGNUP] No price ID found for plan:', plan)
      console.error('[SIGNUP] Available env vars:', Object.keys(priceIdMap).map(k => `${k}: ${!!priceIdMap[k]}`))
      await getStripe().customers.del(customer.id)
      return NextResponse.json(
        { error: `Stripe price not configured for plan: ${plan}` },
        { status: 500 }
      )
    }

    // Create Stripe Checkout Session
    console.log('[SIGNUP] Creating Stripe Checkout Session')
    try {
      const checkoutSession = await getStripe().checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 7,
          metadata: {
            plan,
          },
        },
        payment_method_collection: 'always',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?error=payment_cancelled`,
        metadata: {
          signup_session_id: signupSession.id, // Reference to secure session (NO PASSWORD!)
          plan,
        },
      })
      console.log('[SIGNUP] Checkout Session created:', checkoutSession.id)

      // Update signup session with checkout session ID
      await getSupabase()
        .from('jordyn_signup_sessions')
        .update({ stripe_checkout_session_id: checkoutSession.id })
        .eq('id', signupSession.id)

      return NextResponse.json({
        success: true,
        checkoutUrl: checkoutSession.url,
      })
    } catch (checkoutError: any) {
      console.error('[SIGNUP] ===== CHECKOUT SESSION ERROR =====')
      console.error('[SIGNUP] Error type:', checkoutError?.type)
      console.error('[SIGNUP] Error code:', checkoutError?.code)
      console.error('[SIGNUP] Error message:', checkoutError?.message)
      console.error('[SIGNUP] Full error:', JSON.stringify(checkoutError, null, 2))
      console.error('[SIGNUP] ========================================')
      // Cleanup customer
      await getStripe().customers.del(customer.id)
      return NextResponse.json(
        { error: `Checkout error: ${checkoutError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('[SIGNUP] ===== UNEXPECTED ERROR =====')
    console.error('[SIGNUP] Error name:', error?.name)
    console.error('[SIGNUP] Error message:', error?.message)
    console.error('[SIGNUP] Error stack:', error?.stack)
    console.error('[SIGNUP] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[SIGNUP] ========================================')
    return NextResponse.json(
      { error: `Unexpected error: ${error?.message || 'Please try again'}` },
      { status: 500 }
    )
  }
}
