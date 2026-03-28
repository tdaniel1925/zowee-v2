import twilio from 'twilio'

if (!process.env.TWILIO_ACCOUNT_SID) {
  throw new Error('Missing env.TWILIO_ACCOUNT_SID')
}
if (!process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('Missing env.TWILIO_AUTH_TOKEN')
}
if (!process.env.TWILIO_PHONE_NUMBER) {
  throw new Error('Missing env.TWILIO_PHONE_NUMBER')
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

// Send SMS helper
export async function sendSMS(to: string, message: string) {
  return await twilioClient.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: to,
  })
}

// Validate Twilio signature
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )
}
