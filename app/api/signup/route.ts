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
  try {
    const body = await req.json()
    const { name, phone, email, password, plan } = body

    // Validate input
    if (!name || !phone || !email || !password || !plan) {
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
    const { data: existingUser } = await getSupabase()
      .from('jordyn_users')
      .select('id')
      .eq('phone', `+1${phone}`)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'This number is already registered. Try signing in instead.' },
        { status: 409 }
      )
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await getSupabase().auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        phone: `+1${phone}`,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth creation error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    // Create Stripe customer
    let customer
    try {
      customer = await getStripe().customers.create({
        name,
        phone: `+1${phone}`,
        metadata: {
          plan,
        },
      })
    } catch (stripeError: any) {
      console.error('Stripe customer creation error:', stripeError.message)
      return NextResponse.json(
        { error: stripeError.message?.includes('API key') ? 'Invalid API key' : 'Payment processing error. Please try again.' },
        { status: 500 }
      )
    }

    // Get Stripe price ID based on plan
    const priceIdMap: Record<string, string> = {
      solo: process.env.STRIPE_SOLO_PRICE_ID!,
      family: process.env.STRIPE_FAMILY_PRICE_ID!,
      solo_voice: process.env.STRIPE_SOLO_VOICE_PRICE_ID!,
      family_voice: process.env.STRIPE_FAMILY_VOICE_PRICE_ID!,
      business: process.env.STRIPE_BUSINESS_PRICE_ID!,
      test: process.env.STRIPE_TEST_PRICE_ID!,
    }
    const priceId = priceIdMap[plan]

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price not configured for plan: ${plan}` },
        { status: 500 }
      )
    }

    // Create Stripe subscription with 7-day trial
    let subscription
    try {
      subscription = await getStripe().subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: 7,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      })
    } catch (stripeSubError: any) {
      console.error('Stripe subscription creation error:', stripeSubError.message)
      // Cleanup customer
      await getStripe().customers.del(customer.id)
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: stripeSubError.message?.includes('price') ? 'Invalid price configuration. Please contact support.' : stripeSubError.message },
        { status: 500 }
      )
    }

    // Create user in jordyn_users table FIRST
    const { data: newUser, error: dbError } = await getSupabase()
      .from('jordyn_users')
      .insert({
        auth_user_id: authData.user.id, // Link to Supabase Auth user
        name,
        phone: `+1${phone}`,
        plan,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Cleanup Stripe and Auth resources
      await getStripe().subscriptions.cancel(subscription.id)
      await getStripe().customers.del(customer.id)
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      )
    }

    // Provision individual Twilio phone number for this user
    // Number is automatically added to Messaging Service linked to A2P campaign
    console.log('[SIGNUP] Provisioning Twilio phone number')
    const phoneResult = await provisionPhoneNumber(newUser.id)

    if (!phoneResult.success || !phoneResult.phoneNumber) {
      console.error('[SIGNUP] Phone provisioning failed:', phoneResult.error)
      // Cleanup - delete user, subscription, auth
      await getSupabase().from('jordyn_users').delete().eq('id', newUser.id)
      await getStripe().subscriptions.cancel(subscription.id)
      await getStripe().customers.del(customer.id)
      await getSupabase().auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to provision phone number. Please try again.' },
        { status: 500 }
      )
    }

    const JordynNumber = phoneResult.phoneNumber
    console.log(`[SIGNUP] Provisioned Twilio phone number: ${JordynNumber}`)
    console.log(`[SIGNUP] Number added to A2P campaign via Messaging Service: ${phoneResult.messagingServiceSid}`)

    // Provision VAPI voice agent if plan includes voice features
    if (isPlanVoiceEnabled(plan as any)) {
      console.log(`[SIGNUP] Voice features enabled for ${plan} plan`)
      // VAPI voice agent provisioning will be added here
      // Links Twilio number to VAPI for voice calls
    }

    // Send welcome SMS from user's NEW Jordyn number
    const hasVoice = isPlanVoiceEnabled(plan as any)
    const welcomeMessage = hasVoice
      ? `Welcome to Jordyn! 🎉\n\nThis is YOUR personal AI assistant number!\n\nYou can text OR call THIS number:\n• Text: "Track PS5 prices under $450"\n• Call: Say "Book me a flight to NYC"\n• Smart Home: "Turn off bedroom lights"\n\nSave this number in your contacts as "My Jordyn Assistant"\n\n🏠 Want smart home control? Link your Alexa account at:\n${process.env.NEXT_PUBLIC_APP_URL}/account/integrations\n\nYour 7-day free trial starts now. Enjoy!\n\n- The Jordyn Team`
      : `Welcome to Jordyn! 🎉\n\nThis is YOUR personal AI assistant number!\n\nSave this number in your contacts and text it anything:\n• "Book me a flight to NYC next Friday"\n• "Track PS5 prices under $450"\n• "Find a sushi restaurant near me tonight"\n\n🏠 Want smart home control? Link your Alexa account at:\n${process.env.NEXT_PUBLIC_APP_URL}/account/integrations\n\nYour 7-day free trial starts now. Enjoy!\n\n- The Jordyn Team`

    try {
      const smsResult = await sendSMS(
        JordynNumber,      // From: User's NEW Jordyn number
        `+1${phone}`,      // To: User's personal phone
        welcomeMessage
      )
      if (!smsResult.success) {
        console.error('SMS send error:', smsResult.error)
      }
    } catch (smsError) {
      console.error('SMS send error:', smsError)
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
            phone: newUser.phone,
            jordyn_number: JordynNumber,
          },
          subscription: {
            plan: plan as any,
            amount: planAmounts[plan],
            status: 'trialing',
            trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
          },
        },
        newUser.id
      )
    } catch (apexError) {
      console.error('Apex webhook error:', apexError)
      // Don't fail the signup if Apex webhook fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email,
        JordynNumber,
        plan,
        trialEnd: newUser.trial_ends_at,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
