/**
 * Twilio Phone Number Provisioning
 * Provisions individual phone numbers for users and assigns them to A2P campaign
 */

import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

let supabaseInstance: any = null

const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

export interface ProvisioningResult {
  success: boolean
  phoneNumber?: string
  sid?: string
  messagingServiceSid?: string
  error?: string
}

/**
 * Search for available phone numbers
 */
export async function searchAvailableNumbers(areaCode?: string): Promise<string[]> {
  try {
    const searchParams: any = {
      limit: 10,
      capabilities: {
        sms: true,
        voice: true,
        mms: true
      }
    }

    if (areaCode) {
      searchParams.areaCode = areaCode
    }

    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list(searchParams)

    return availableNumbers.map(num => num.phoneNumber)
  } catch (error) {
    console.error('[Twilio] Error searching numbers:', error)
    throw error
  }
}

/**
 * Purchase a phone number and add to Messaging Service (A2P campaign)
 *
 * IMPORTANT: The Messaging Service MUST be linked to your approved A2P 10DLC campaign.
 * All numbers added to this service automatically inherit the campaign registration.
 */
export async function purchasePhoneNumber(phoneNumber: string): Promise<{
  sid: string
  messagingServiceSid: string
}> {
  try {
    // Get Messaging Service SID from environment
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    if (!messagingServiceSid) {
      throw new Error('TWILIO_MESSAGING_SERVICE_SID environment variable is required')
    }

    console.log(`[Twilio] Purchasing number: ${phoneNumber}`)

    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`,
      smsMethod: 'POST',
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      voiceMethod: 'POST',
    })

    console.log(`[Twilio] Number purchased: ${purchasedNumber.sid}`)

    // Add to Messaging Service (which is linked to A2P campaign)
    await client.messaging.v1
      .services(messagingServiceSid)
      .phoneNumbers
      .create({
        phoneNumberSid: purchasedNumber.sid
      })

    console.log(`[Twilio] Number added to Messaging Service: ${messagingServiceSid}`)
    console.log(`[Twilio] Number is now A2P compliant via campaign`)

    return {
      sid: purchasedNumber.sid,
      messagingServiceSid
    }
  } catch (error) {
    console.error('[Twilio] Error purchasing/configuring number:', error)
    throw error
  }
}

/**
 * Provision a phone number for a user
 * - Searches for available number
 * - Purchases it
 * - Adds to Messaging Service (A2P campaign)
 * - Saves to database
 */
export async function provisionPhoneNumber(
  userId: string,
  areaCode?: string
): Promise<ProvisioningResult> {
  try {
    console.log(`[Twilio] Provisioning phone number for user ${userId}`)

    // 1. Search for available numbers
    const availableNumbers = await searchAvailableNumbers(areaCode)

    if (availableNumbers.length === 0) {
      return {
        success: false,
        error: 'No available phone numbers found'
      }
    }

    const phoneNumber = availableNumbers[0]
    console.log(`[Twilio] Selected number: ${phoneNumber}`)

    // 2. Purchase and configure number (adds to A2P campaign)
    const { sid, messagingServiceSid } = await purchasePhoneNumber(phoneNumber)

    // 3. Save to database
    const { error: dbError } = await getSupabase()
      .from('pokkit_users')
      .update({
        twilio_phone_number: phoneNumber,
        twilio_phone_number_sid: sid,
        twilio_messaging_service_sid: messagingServiceSid,
      })
      .eq('id', userId)

    if (dbError) {
      console.error('[Twilio] Database update error:', dbError)
      // Try to release the number
      try {
        await client.incomingPhoneNumbers(sid).remove()
      } catch (releaseError) {
        console.error('[Twilio] Failed to release number:', releaseError)
      }
      return {
        success: false,
        error: 'Failed to save phone number to database'
      }
    }

    console.log(`[Twilio] Provisioning complete for user ${userId}`)
    return {
      success: true,
      phoneNumber,
      sid,
      messagingServiceSid
    }
  } catch (error: any) {
    console.error('[Twilio] Provisioning error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Release a phone number (cancel/delete)
 */
export async function releasePhoneNumber(userId: string): Promise<void> {
  try {
    const { data: user } = await getSupabase()
      .from('pokkit_users')
      .select('twilio_phone_number_sid, twilio_messaging_service_sid')
      .eq('id', userId)
      .single()

    if (!user || !user.twilio_phone_number_sid) {
      console.log('[Twilio] No phone number to release for user:', userId)
      return
    }

    // Remove from Messaging Service
    if (user.twilio_messaging_service_sid) {
      await client.messaging.v1
        .services(user.twilio_messaging_service_sid)
        .phoneNumbers(user.twilio_phone_number_sid)
        .remove()
    }

    // Release the number
    await client.incomingPhoneNumbers(user.twilio_phone_number_sid).remove()

    // Update database
    await getSupabase()
      .from('pokkit_users')
      .update({
        twilio_phone_number: null,
        twilio_phone_number_sid: null,
        twilio_messaging_service_sid: null,
      })
      .eq('id', userId)

    console.log('[Twilio] Phone number released for user:', userId)
  } catch (error) {
    console.error('[Twilio] Error releasing number:', error)
    throw error
  }
}

/**
 * Send SMS using Messaging Service (for A2P compliance)
 */
export async function sendSMS(
  from: string,
  to: string,
  body: string
): Promise<ProvisioningResult> {
  try {
    // Use Messaging Service SID for A2P compliance
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    await client.messages.create({
      body,
      from, // Specific phone number
      to,
      messagingServiceSid, // Links to A2P campaign
    })

    console.log(`[Twilio] SMS sent from ${from} to ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Twilio] Error sending SMS:`, error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    }
  }
}
