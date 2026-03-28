import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPaymentMethods, removePaymentMethod } from '@/lib/stripe/payment-methods'

/**
 * Get user's payment methods
 */
export async function GET(request: NextRequest) {
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
    const paymentMethods = await getUserPaymentMethods(zoweeUser.id)
    return NextResponse.json({ payment_methods: paymentMethods })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch payment methods',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Remove a payment method
 */
export async function DELETE(request: NextRequest) {
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

    await removePaymentMethod(zoweeUser.id, payment_method_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing payment method:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove payment method',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
