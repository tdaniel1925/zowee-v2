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
 * @param to - Recipient phone number
 * @param body - Message body
 * @param from - Optional sender phone number (defaults to TWILIO_PHONE_NUMBER)
 */
export async function sendSMS(to: string, body: string, from?: string): Promise<void> {
  const fromNumber = from || process.env.TWILIO_PHONE_NUMBER!

  try {
    await client.messages.create({
      body,
      from: fromNumber,
      to,
    })

    console.log(`[Twilio] SMS sent from ${fromNumber} to ${to}`)
  } catch (error) {
    console.error(`[Twilio] Error sending SMS from ${fromNumber} to ${to}:`, error)
    throw error
  }
}
