import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin()

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`💳 Stripe event: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed:', session.id)

        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan || 'solo'

        if (!userId) {
          console.error('No user_id in session metadata')
          break
        }

        // Update user with Stripe IDs and trial info
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        await supabase
          .from('zowee_users')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: plan,
            plan_status: 'trialing',
            trial_ends_at: trialEndsAt.toISOString(),
          })
          .eq('id', userId)

        console.log(`✅ User ${userId} subscription started (trialing)`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('Invoice paid:', invoice.id)

        // Update user to active status
        await supabase
          .from('zowee_users')
          .update({ plan_status: 'active' })
          .eq('stripe_customer_id', customerId)

        console.log(`✅ User subscription activated (customer: ${customerId})`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('Payment failed:', invoice.id)

        // Update user to past_due status
        await supabase
          .from('zowee_users')
          .update({ plan_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log(`⚠️ User payment failed (customer: ${customerId})`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription canceled:', subscription.id)

        // Update user to canceled status
        await supabase
          .from('zowee_users')
          .update({ plan_status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`❌ User subscription canceled (sub: ${subscription.id})`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        console.log('Subscription updated:', subscription.id)

        // Get the price to determine the plan
        const priceId = subscription.items.data[0]?.price.id
        let plan = 'solo'

        if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) {
          plan = 'family'
        }

        await supabase
          .from('zowee_users')
          .update({ plan })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`✅ User subscription updated to ${plan}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
