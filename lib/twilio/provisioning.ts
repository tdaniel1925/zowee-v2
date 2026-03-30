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

    console.log('[Twilio] Searching with params:', searchParams)
    const availableNumbers = await client.availablePhoneNumbers('US')
      .local
      .list(searchParams)

    console.log('[Twilio] Search returned', availableNumbers.length, 'numbers')
    return availableNumbers.map(num => num.phoneNumber)
  } catch (error: any) {
    console.error('[Twilio] ===== ERROR SEARCHING NUMBERS =====')
    console.error('[Twilio] Error message:', error?.message)
    console.error('[Twilio] Error code:', error?.code)
    console.error('[Twilio] Error status:', error?.status)
    console.error('[Twilio] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[Twilio] ========================================')
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
    console.log(`[Twilio] SMS URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`)
    console.log(`[Twilio] Voice URL: ${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`)

    // Purchase the phone number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/sms`,
      smsMethod: 'POST',
      voiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/voice`,
      voiceMethod: 'POST',
    })

    console.log(`[Twilio] Number purchased successfully: ${purchasedNumber.sid}`)

    // Add to Messaging Service (which is linked to A2P campaign)
    console.log(`[Twilio] Adding number to Messaging Service: ${messagingServiceSid}`)
    await client.messaging.v1
      .services(messagingServiceSid)
      .phoneNumbers
      .create({
        phoneNumberSid: purchasedNumber.sid
      })

    console.log(`[Twilio] Number added to Messaging Service successfully`)
    console.log(`[Twilio] Number is now A2P compliant via campaign`)

    return {
      sid: purchasedNumber.sid,
      messagingServiceSid
    }
  } catch (error: any) {
    console.error('[Twilio] ===== ERROR PURCHASING/CONFIGURING NUMBER =====')
    console.error('[Twilio] Error message:', error?.message)
    console.error('[Twilio] Error code:', error?.code)
    console.error('[Twilio] Error status:', error?.status)
    console.error('[Twilio] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[Twilio] ========================================')
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
    console.log(`[Twilio] ===== STARTING PHONE PROVISIONING =====`)
    console.log(`[Twilio] User ID: ${userId}`)
    console.log(`[Twilio] Twilio Account SID present:`, !!process.env.TWILIO_ACCOUNT_SID)
    console.log(`[Twilio] Twilio Auth Token present:`, !!process.env.TWILIO_AUTH_TOKEN)
    console.log(`[Twilio] Messaging Service SID present:`, !!process.env.TWILIO_MESSAGING_SERVICE_SID)
    console.log(`[Twilio] App URL:`, process.env.NEXT_PUBLIC_APP_URL)

    // 1. Search for available numbers
    console.log(`[Twilio] Step 1: Searching for available numbers...`)
    const availableNumbers = await searchAvailableNumbers(areaCode)
    console.log(`[Twilio] Found ${availableNumbers.length} available numbers`)

    if (availableNumbers.length === 0) {
      console.error('[Twilio] ERROR: No available phone numbers found')
      return {
        success: false,
        error: 'No available phone numbers found'
      }
    }

    const phoneNumber = availableNumbers[0]
    console.log(`[Twilio] Step 2: Selected number: ${phoneNumber}`)

    // 2. Purchase and configure number (adds to A2P campaign)
    console.log(`[Twilio] Step 3: Purchasing number...`)
    const { sid, messagingServiceSid } = await purchasePhoneNumber(phoneNumber)
    console.log(`[Twilio] Number purchased successfully. SID: ${sid}`)

    // 3. Save to database
    console.log(`[Twilio] Step 4: Saving to database...`)
    const { error: dbError } = await getSupabase()
      .from('jordyn_users')
      .update({
        twilio_phone_number: phoneNumber,
        twilio_phone_number_sid: sid,
        twilio_messaging_service_sid: messagingServiceSid,
      })
      .eq('id', userId)

    if (dbError) {
      console.error('[Twilio] ===== DATABASE UPDATE ERROR =====')
      console.error('[Twilio] Error:', JSON.stringify(dbError, null, 2))
      console.error('[Twilio] ========================================')
      // Try to release the number
      try {
        await client.incomingPhoneNumbers(sid).remove()
        console.log('[Twilio] Released purchased number due to DB error')
      } catch (releaseError) {
        console.error('[Twilio] Failed to release number:', releaseError)
      }
      return {
        success: false,
        error: `Database error: ${dbError.message || 'Failed to save phone number'}`
      }
    }

    console.log(`[Twilio] ===== PROVISIONING COMPLETE =====`)
    return {
      success: true,
      phoneNumber,
      sid,
      messagingServiceSid
    }
  } catch (error: any) {
    console.error('[Twilio] ===== PROVISIONING ERROR =====')
    console.error('[Twilio] Error name:', error?.name)
    console.error('[Twilio] Error message:', error?.message)
    console.error('[Twilio] Error code:', error?.code)
    console.error('[Twilio] Error status:', error?.status)
    console.error('[Twilio] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('[Twilio] ========================================')
    return {
      success: false,
      error: error.message || 'Unknown error during phone provisioning'
    }
  }
}

/**
 * Release a phone number (cancel/delete)
 */
export async function releasePhoneNumber(userId: string): Promise<void> {
  try {
    const { data: user } = await getSupabase()
      .from('jordyn_users')
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
      .from('jordyn_users')
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
