import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attachPaymentMethod } from '@/lib/stripe/payment-methods'

/**
 * Add a payment method to user's profile
 * Expects: { payment_method_id: "pm_xxx" } from Stripe Elements
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Zowee user
  const { data: zoweeUser } = await supabase
    .from('zowee_users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!zoweeUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const { payment_method_id } = await request.json()

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
    }

    // Attach payment method to user
    await attachPaymentMethod(zoweeUser.id, payment_method_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding payment method:', error)
    return NextResponse.json(
      {
        error: 'Failed to add payment method',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
