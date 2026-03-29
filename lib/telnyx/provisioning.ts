/**
 * Telnyx Phone Number Provisioning
 * Provisions individual phone numbers for each Pokkit user
 */

import { telnyx } from './client'
import { supabaseAdmin } from '../supabase'

export interface ProvisioningResult {
  success: boolean
  phoneNumber?: string
  phoneNumberId?: string
  messagingProfileId?: string
  error?: string
}

/**
 * Search for available phone numbers in a specific area code
 */
export async function searchAvailableNumbers(
  areaCode?: string
): Promise<string[]> {
  try {
    const params: any = {
      filter: {
        country_code: 'US',
        features: ['sms', 'voice'],
        limit: 10,
      },
    }

    if (areaCode) {
      params.filter.national_destination_code = areaCode
    }

    const response = await telnyx.availablePhoneNumbers.list(params)
    return response.data?.map((number: any) => number.phone_number) || []
  } catch (error) {
    console.error('[Telnyx] Error searching numbers:', error)
    return []
  }
}

/**
 * Purchase a phone number for a user
 */
async function purchasePhoneNumber(
  phoneNumber: string
): Promise<{ phoneNumberId: string; messagingProfileId: string }> {
  try {
    // 1. Order the phone number
    const orderResponse = await telnyx.numberOrders.create({
      phone_numbers: [{ phone_number: phoneNumber }],
    })

    console.log(`[Telnyx] Ordered phone number: ${phoneNumber}`)

    // 2. Get the phone number ID from the order
    if (!orderResponse.data?.phone_numbers?.[0]?.id) {
      throw new Error('Failed to get phone number ID from order response')
    }
    const phoneNumberId = orderResponse.data.phone_numbers[0].id

    // 3. Create a messaging profile for this number
    const messagingProfile = await telnyx.messagingProfiles.create({
      name: `Jordyn User - ${phoneNumber}`,
      enabled: true,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/sms`,
      webhook_failover_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/telnyx/sms`,
      webhook_api_version: '2',
      whitelisted_destinations: ['US'],
    })

    if (!messagingProfile.data?.id) {
      throw new Error('Failed to create messaging profile')
    }

    console.log(
      `[Telnyx] Created messaging profile: ${messagingProfile.data.id}`
    )

    // 4. Associate the phone number with the messaging profile
    await telnyx.phoneNumbers.update(phoneNumberId, {
      connection_id: messagingProfile.data.id,
    } as any)

    console.log(`[Telnyx] Associated number with messaging profile`)

    return {
      phoneNumberId,
      messagingProfileId: messagingProfile.data.id,
    }
  } catch (error) {
    console.error('[Telnyx] Error purchasing number:', error)
    throw error
  }
}

/**
 * Provision a phone number for a new user
 */
export async function provisionPhoneNumber(
  userId: string,
  areaCode?: string
): Promise<ProvisioningResult> {
  try {
    console.log(`[Telnyx] Provisioning phone number for user ${userId}`)

    // 1. Search for available numbers
    const availableNumbers = await searchAvailableNumbers(areaCode)

    if (availableNumbers.length === 0) {
      return {
        success: false,
        error: 'No available phone numbers found in requested area',
      }
    }

    // 2. Purchase the first available number
    const phoneNumber = availableNumbers[0]
    const { phoneNumberId, messagingProfileId } =
      await purchasePhoneNumber(phoneNumber)

    // 3. Save to database
    const admin = supabaseAdmin()
    const { error: dbError } = await admin
      .from('jordyn_users')
      .update({
        telnyx_phone_number: phoneNumber,
        telnyx_phone_number_id: phoneNumberId,
        telnyx_messaging_profile_id: messagingProfileId,
      })
      .eq('id', userId)

    if (dbError) {
      console.error('[Telnyx] Database update failed:', dbError)
      // Attempt to release the number
      try {
        await telnyx.phoneNumbers.delete(phoneNumberId)
      } catch (cleanupError) {
        console.error('[Telnyx] Cleanup failed:', cleanupError)
      }
      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      }
    }

    console.log(
      `[Telnyx] Successfully provisioned ${phoneNumber} for user ${userId}`
    )

    return {
      success: true,
      phoneNumber,
      phoneNumberId,
      messagingProfileId,
    }
  } catch (error) {
    console.error('[Telnyx] Provisioning failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Release a phone number when user cancels
 */
export async function releasePhoneNumber(
  userId: string
): Promise<ProvisioningResult> {
  try {
    console.log(`[Telnyx] Releasing phone number for user ${userId}`)

    // 1. Get user's phone number ID
    const admin = supabaseAdmin()
    const { data: user, error: fetchError } = await admin
      .from('jordyn_users')
      .select('telnyx_phone_number_id, telnyx_messaging_profile_id')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.telnyx_phone_number_id) {
      return {
        success: false,
        error: 'No phone number found for user',
      }
    }

    // 2. Delete the phone number from Telnyx
    await telnyx.phoneNumbers.delete(user.telnyx_phone_number_id)

    // 3. Delete the messaging profile
    if (user.telnyx_messaging_profile_id) {
      await telnyx.messagingProfiles.delete(user.telnyx_messaging_profile_id)
    }

    // 4. Update database
    const { error: dbError } = await admin
      .from('jordyn_users')
      .update({
        telnyx_phone_number: null,
        telnyx_phone_number_id: null,
        telnyx_messaging_profile_id: null,
      })
      .eq('id', userId)

    if (dbError) {
      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      }
    }

    console.log(`[Telnyx] Successfully released phone number for user ${userId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Telnyx] Release failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send SMS via Telnyx
 */
export async function sendSMS(
  from: string,
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await (telnyx as any).messages.create({
      from,
      to,
      text: body,
    })

    console.log(`[Telnyx] Sent SMS from ${from} to ${to}`)

    return { success: true }
  } catch (error) {
    console.error('[Telnyx] SMS send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
