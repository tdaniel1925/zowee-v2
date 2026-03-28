/**
 * Twilio SMS Utilities
 * Helper functions for sending SMS via Twilio
 */

import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

/**
 * Send an SMS message
 */
export async function sendSMS(to: string, body: string): Promise<void> {
  try {
    await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to,
    })

    console.log(`[Twilio] SMS sent to ${to}`)
  } catch (error) {
    console.error(`[Twilio] Error sending SMS to ${to}:`, error)
    throw error
  }
}
