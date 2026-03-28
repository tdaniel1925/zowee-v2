import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import twilio from 'twilio'
import { sendToApex } from '@/lib/apex/webhook'

let supabaseInstance: any = null
let stripeInstance: Stripe | null = null
let twilioInstance: any = null

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

    if (!['solo', 'family'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check if phone already exists
    const { data: existingUser } = await getSupabase()
      .from('zowee_users')
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
    const customer = await getStripe().customers.create({
      name,
      phone: `+1${phone}`,
      metadata: {
        plan,
      },
    })

    // Get Stripe price ID based on plan
    const priceId =
      plan === 'solo'
        ? process.env.STRIPE_SOLO_PRICE_ID!
        : process.env.STRIPE_FAMILY_PRICE_ID!

    // Create Stripe subscription with 14-day trial
    const subscription = await getStripe().subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    })

    // Allocate Zowee number (for now, use a placeholder - will implement actual number pool later)
    const zoweeNumber = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`

    // Create user in zowee_users table
    const { data: newUser, error: dbError } = await getSupabase()
      .from('zowee_users')
      .insert({
        auth_user_id: authData.user.id, // Link to Supabase Auth user
        name,
        phone: `+1${phone}`,
        plan,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        plan_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        zowee_number: zoweeNumber,
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

    // Send welcome SMS
    try {
      await getTwilio().messages.create({
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: `+1${phone}`,
        body: `Welcome to Zowee! 🎉\n\nYour personal AI assistant number is:\n${zoweeNumber}\n\nSave this number and text it anything:\n• "Book me a flight to NYC next Friday"\n• "Track PS5 prices under $450"\n• "Find a sushi restaurant near me tonight"\n\nYour 14-day free trial starts now. Enjoy!\n\n- The Zowee Team`,
      })
    } catch (smsError) {
      console.error('SMS send error:', smsError)
      // Don't fail the signup if SMS fails
    }

    // Send customer data to Apex
    try {
      await sendToApex(
        'customer.trial_start',
        {
          customer: {
            id: newUser.id,
            name: newUser.name,
            phone: newUser.phone,
            zowee_number: zoweeNumber,
          },
          subscription: {
            plan: plan as 'solo' | 'family',
            amount: plan === 'solo' ? 15 : 24,
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
        zoweeNumber,
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
