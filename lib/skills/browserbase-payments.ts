/**
 * Browserbase Payment Processing Skills
 * Handles payment processing with explicit user confirmation
 * SECURITY: NEVER stores raw card data, uses Stripe tokenized payment methods only
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { SMSIntent } from '@/lib/sms/parser'
import { ZoweeContext } from '@/lib/sms/context'
import { createBrowserTask, loadUserProfile, getBrowserTask } from '@/lib/browserbase/session'
import { SkillResult } from './executor'

/**
 * Handle payment authorization request
 * Creates a task with status 'pending_confirmation' and asks user to confirm
 */
export async function handlePayment(
  intent: SMSIntent,
  context: ZoweeContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { amount, merchant, task_id } = intent.entities

  // Load user profile to get payment method
  const profile = await loadUserProfile(context.user.id, supabase)

  if (!profile.payment_methods || profile.payment_methods.length === 0) {
    return {
      success: false,
      message: `💳 I need your payment info first. Visit ${process.env.NEXT_PUBLIC_APP_URL}/account/payment-methods to add a card.`,
    }
  }

  const paymentMethod = profile.payment_methods[0]

  // Build instructions for Twin
  const instructions = buildPaymentInstructions(intent, profile)

  // Create task with status 'pending_confirmation'
  try {
    const task = await createBrowserTask(
      {
        user_id: context.user.id,
        task_type: 'payment',
        status: 'pending_confirmation',
        intent,
        instructions,
      },
      supabase
    )

    // Ask for explicit confirmation
    const amountStr = amount ? `$${amount}` : 'the amount'
    const merchantStr = merchant || 'this merchant'

    return {
      success: true,
      message: `💳 Ready to charge ${paymentMethod.brand} ****${paymentMethod.last4} for ${amountStr} at ${merchantStr}?\n\nReply YES to confirm or CANCEL to stop.`,
      data: { task_id: task.id, requires_confirmation: true },
    }
  } catch (error) {
    console.error('Error creating payment task:', error)
    return {
      success: false,
      message: "Sorry, I couldn't set up the payment. Please try again.",
    }
  }
}

/**
 * Confirm payment after user replies "YES"
 * Updates task status to 'pending' so Twin can process it
 */
export async function confirmPayment(
  taskId: string,
  context: ZoweeContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  // Get task
  const task = await getBrowserTask(taskId, supabase)

  if (!task) {
    return {
      success: false,
      message: "Payment task not found. It may have expired.",
    }
  }

  if (task.status !== 'pending_confirmation') {
    return {
      success: false,
      message: "This payment has already been processed or canceled.",
    }
  }

  // Update task to pending so Twin can pick it up
  await supabase
    .from('zowee_browser_tasks')
    .update({
      status: 'pending',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  return {
    success: true,
    message: `💳 Processing payment... I'll confirm when complete!`,
  }
}

/**
 * Cancel payment after user replies "CANCEL"
 */
export async function cancelPayment(
  taskId: string,
  context: ZoweeContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  // Update task to failed with cancellation message
  await supabase
    .from('zowee_browser_tasks')
    .update({
      status: 'failed',
      error: 'User canceled payment',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  return {
    success: true,
    message: `✅ Payment canceled. No charges made.`,
  }
}

/**
 * Build payment instructions for Claude Computer Use
 * SECURITY NOTE: Instructions include Stripe payment method ID, NOT raw card data
 */
function buildPaymentInstructions(intent: SMSIntent, profile: any): string {
  const { amount, merchant, url, data } = intent.entities
  const paymentMethod = profile.payment_methods[0]

  let instructions = 'Payment Processing Task:\n\n'

  instructions += `⚠️ SECURITY: Use Stripe Payment Method ID, NEVER raw card data\n\n`

  instructions += `Payment Method:\n`
  instructions += `- Type: Stripe tokenized payment method\n`
  instructions += `- ID: ${paymentMethod.id}\n`
  instructions += `- Last 4: ${paymentMethod.last4}\n`
  instructions += `- Brand: ${paymentMethod.brand}\n\n`

  instructions += `Transaction Details:\n`
  if (amount) instructions += `- Amount: $${amount}\n`
  if (merchant) instructions += `- Merchant: ${merchant}\n`
  if (url) instructions += `- URL: ${url}\n`

  instructions += `\nUser Profile:\n`
  instructions += `- Name: ${profile.name}\n`
  instructions += `- Email: ${profile.email}\n`
  instructions += `- Phone: ${profile.phone || 'Not provided'}\n\n`

  instructions += `Task Steps:\n`
  instructions += `1. Navigate to checkout page\n`
  instructions += `2. Fill in billing/shipping info from user profile\n`
  instructions += `3. Use Stripe Payment Method for card info (DO NOT enter raw card data)\n`
  instructions += `4. Complete the purchase\n`
  instructions += `5. Extract confirmation number and receipt\n`
  instructions += `6. Create Stripe Charge record for audit trail\n\n`

  instructions += `Output Format:\n`
  instructions += `Return JSON:\n`
  instructions += `{\n`
  instructions += `  "success": true,\n`
  instructions += `  "merchant": "Merchant name",\n`
  instructions += `  "amount": ${amount || 0},\n`
  instructions += `  "currency": "usd",\n`
  instructions += `  "payment_method": {\n`
  instructions += `    "last4": "${paymentMethod.last4}",\n`
  instructions += `    "brand": "${paymentMethod.brand}"\n`
  instructions += `  },\n`
  instructions += `  "confirmation_number": "Order confirmation from merchant",\n`
  instructions += `  "receipt_url": "Receipt URL if available",\n`
  instructions += `  "stripe_charge_id": "ch_xxx from Stripe API"\n`
  instructions += `}\n`

  return instructions
}

/**
 * Format payment receipt for SMS
 */
export function formatPaymentReceipt(task: any): string {
  const result = task.result

  if (!result) {
    return '❌ Payment task completed but no result returned.'
  }

  if (!result.success) {
    return `❌ Payment failed. ${result.error || 'Please try again or complete manually.'}`
  }

  let message = '✅ Payment Complete!\n\n'
  message += `Merchant: ${result.merchant}\n`
  message += `Amount: $${result.amount}\n`
  message += `Card: ${result.payment_method.brand} ****${result.payment_method.last4}\n`

  if (result.confirmation_number) {
    message += `Confirmation: ${result.confirmation_number}\n`
  }

  if (result.receipt_url) {
    message += `\nReceipt: ${result.receipt_url}`
  } else if (result.stripe_charge_id) {
    message += `\nReceipt: ${process.env.NEXT_PUBLIC_APP_URL}/receipts/${result.stripe_charge_id}`
  }

  // Truncate if too long
  if (message.length > 600) {
    message = message.substring(0, 597) + '...'
  }

  return message
}
