import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const body = await request.json()
    const { name, phone, email, repCode, plan } = body

    // Validate inputs
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    if (!plan || !['solo', 'family'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    console.log(`Creating checkout for ${name} (${phone}) - ${plan} plan`)

    // Create user record first
    const { data: user, error: userError } = await supabase
      .from('zowee_users')
      .insert({
        name,
        phone_number: phone,
        email: email || null,
        rep_code: repCode || null,
        plan: plan,
        plan_status: 'pending',
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log(`✅ User created: ${user.id}`)

    // Determine price ID
    const priceId =
      plan === 'family'
        ? process.env.STRIPE_FAMILY_PRICE_ID
        : process.env.STRIPE_SOLO_PRICE_ID

    if (!priceId) {
      console.error(`Missing price ID for plan: ${plan}`)
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        plan: plan,
        rep_code: repCode || '',
      },
      customer_email: email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup?cancelled=true`,
    })

    console.log(`✅ Checkout session created: ${session.id}`)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
