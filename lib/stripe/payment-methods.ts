/**
 * Stripe Payment Methods Integration
 * Handles attaching and managing tokenized payment methods for users
 * SECURITY: NEVER stores raw card data, only Stripe tokens
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

let stripeInstance: Stripe | null = null

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

/**
 * Attach a Stripe payment method to a user's profile
 * This is called when user adds a card via Stripe Elements on the frontend
 */
export async function attachPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // Get user
  const { data: user, error: userError } = await supabase
    .from('zowee_users')
    .select('stripe_customer_id, profile, email')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new Error('User not found')
  }

  // Create or get Stripe customer
  let customerId = user.stripe_customer_id

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: {
        zowee_user_id: userId,
      },
    })
    customerId = customer.id

    // Save customer ID
    await supabase
      .from('zowee_users')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
  }

  // Attach payment method to customer
  await getStripe().paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })

  // Set as default payment method
  await getStripe().customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  })

  // Get payment method details
  const pm = await getStripe().paymentMethods.retrieve(paymentMethodId)

  if (!pm.card) {
    throw new Error('Payment method is not a card')
  }

  // Save to user profile (tokenized data only)
  const profile = user.profile || {}
  profile.payment_methods = [
    {
      type: 'stripe_payment_method',
      id: pm.id,
      last4: pm.card.last4,
      brand: pm.card.brand,
      exp_month: pm.card.exp_month,
      exp_year: pm.card.exp_year,
    },
  ]

  await supabase.from('zowee_users').update({ profile }).eq('id', userId)
}

/**
 * Remove a payment method from a user's profile
 */
export async function removePaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // Detach from Stripe
  await getStripe().paymentMethods.detach(paymentMethodId)

  // Remove from user profile
  const { data: user } = await supabase
    .from('zowee_users')
    .select('profile')
    .eq('id', userId)
    .single()

  if (user?.profile?.payment_methods) {
    const profile = user.profile
    profile.payment_methods = profile.payment_methods.filter(
      (pm: any) => pm.id !== paymentMethodId
    )

    await supabase.from('zowee_users').update({ profile }).eq('id', userId)
  }
}

/**
 * Get all payment methods for a user
 */
export async function getUserPaymentMethods(userId: string): Promise<any[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  const { data: user } = await supabase
    .from('zowee_users')
    .select('profile')
    .eq('id', userId)
    .single()

  return user?.profile?.payment_methods || []
}

/**
 * Create a Stripe charge (for audit trail after external payment)
 * This is called by Twin after successfully completing a payment on an external site
 */
export async function createChargeRecord(
  userId: string,
  amount: number,
  merchant: string,
  paymentMethodId: string,
  metadata?: Record<string, any>
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // Get user's Stripe customer ID
  const { data: user } = await supabase
    .from('zowee_users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!user?.stripe_customer_id) {
    throw new Error('User has no Stripe customer ID')
  }

  // Create charge
  const charge = await getStripe().charges.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: user.stripe_customer_id,
    source: paymentMethodId,
    description: `Zowee - ${merchant} purchase`,
    metadata: {
      zowee_user_id: userId,
      merchant,
      ...metadata,
    },
  })

  return charge.id
}
