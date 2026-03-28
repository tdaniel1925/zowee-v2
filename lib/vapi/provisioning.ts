/**
 * Voice Agent Provisioning
 * Creates and configures VAPI assistants for users with voice-enabled plans
 */

import { vapi } from './client'
import { supabaseAdmin } from '../supabase'

type PlanType = 'solo' | 'family' | 'solo_voice' | 'family_voice' | 'business'

interface VoiceProvisioningResult {
  success: boolean
  assistantId?: string
  phoneNumberId?: string
  error?: string
}

/**
 * Get voice quota based on plan type
 */
export function getVoiceQuota(plan: PlanType): number {
  switch (plan) {
    case 'solo_voice':
      return 100
    case 'family_voice':
      return 200
    case 'business':
      return 200
    default:
      return 0
  }
}

/**
 * Check if plan has voice enabled
 */
export function isPlanVoiceEnabled(plan: PlanType): boolean {
  return ['solo_voice', 'family_voice', 'business'].includes(plan)
}

/**
 * Get next reset date (1 month from now)
 */
export function getNextResetDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/**
 * Build system prompt for the voice assistant
 */
function buildSystemPrompt(userName: string, userPhone: string): string {
  return `You are Pokkit, a helpful AI assistant for ${userName} (phone: ${userPhone}).

You can help with:
- Booking flights and hotels
- Finding and comparing prices
- Researching products and reading reviews
- Making restaurant reservations
- Tracking prices and getting alerts
- Controlling smart home devices (if connected)
- General questions and conversation

Be concise and action-oriented. When the user asks you to do something, use the available functions to actually complete the task. Always confirm actions before executing them, especially for purchases.

If you need clarification, ask specific questions. Keep responses brief since this is a voice conversation.`
}

/**
 * Provision a VAPI voice agent for a user
 * This should be called when a user signs up for a voice-enabled plan
 */
export async function provisionVoiceAgent(
  userId: string,
  plan: PlanType,
  userName: string,
  userPhone: string
): Promise<VoiceProvisioningResult> {
  try {
    // Check if plan supports voice
    if (!isPlanVoiceEnabled(plan)) {
      return {
        success: false,
        error: `Plan ${plan} does not include voice features`,
      }
    }

    console.log(`[VAPI] Provisioning voice agent for user ${userId} (${plan})`)

    // 1. Create VAPI assistant for this user
    const assistant = await vapi.createAssistant({
      name: `Pokkit Assistant - ${userName}`,
      userId,
      systemPrompt: buildSystemPrompt(userName, userPhone),
    })

    console.log(`[VAPI] Created assistant ${assistant.id}`)

    // 2. Import Twilio phone number to VAPI
    // For now, we'll use the shared Pokkit number
    // In production, you might want to assign unique numbers per user
    const phoneNumber = await vapi.importPhoneNumber(
      process.env.TWILIO_PHONE_NUMBER!
    )

    console.log(`[VAPI] Imported phone number ${phoneNumber.id}`)

    // 3. Link assistant to phone number
    await vapi.linkAssistantToNumber(phoneNumber.id, assistant.id)

    console.log(`[VAPI] Linked assistant to phone number`)

    // 4. Save to database
    const admin = supabaseAdmin()
    const { error: dbError } = await admin
      .from('pokkit_users')
      .update({
        vapi_assistant_id: assistant.id,
        vapi_phone_number_id: phoneNumber.id,
        voice_enabled: true,
        voice_minutes_quota: getVoiceQuota(plan),
        voice_minutes_used: 0,
        voice_minutes_reset_at: getNextResetDate().toISOString(),
      })
      .eq('id', userId)

    if (dbError) {
      console.error('[VAPI] Database update failed:', dbError)
      // Attempt to clean up the assistant
      try {
        await vapi.deleteAssistant(assistant.id)
      } catch (cleanupError) {
        console.error('[VAPI] Cleanup failed:', cleanupError)
      }
      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      }
    }

    console.log(`[VAPI] Successfully provisioned voice agent for ${userId}`)

    return {
      success: true,
      assistantId: assistant.id,
      phoneNumberId: phoneNumber.id,
    }
  } catch (error) {
    console.error('[VAPI] Provisioning failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deprovision a voice agent (when user downgrades or cancels)
 */
export async function deprovisionVoiceAgent(
  userId: string
): Promise<VoiceProvisioningResult> {
  try {
    console.log(`[VAPI] Deprovisioning voice agent for user ${userId}`)

    // Get user's assistant ID
    const admin = supabaseAdmin()
    const { data: user, error: fetchError } = await admin
      .from('pokkit_users')
      .select('vapi_assistant_id')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.vapi_assistant_id) {
      return {
        success: false,
        error: 'No voice agent found for user',
      }
    }

    // Delete the assistant from VAPI
    await vapi.deleteAssistant(user.vapi_assistant_id)

    // Update database
    const { error: dbError } = await admin
      .from('pokkit_users')
      .update({
        vapi_assistant_id: null,
        vapi_phone_number_id: null,
        voice_enabled: false,
        voice_minutes_quota: 0,
        voice_minutes_used: 0,
        voice_minutes_reset_at: null,
      })
      .eq('id', userId)

    if (dbError) {
      return {
        success: false,
        error: `Database error: ${dbError.message}`,
      }
    }

    console.log(`[VAPI] Successfully deprovisioned voice agent for ${userId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[VAPI] Deprovisioning failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update voice agent configuration (when user's context changes)
 */
export async function updateVoiceAgent(
  userId: string,
  updates: {
    name?: string
    phone?: string
  }
): Promise<VoiceProvisioningResult> {
  try {
    // Get user's assistant ID
    const admin = supabaseAdmin()
    const { data: user, error: fetchError } = await admin
      .from('pokkit_users')
      .select('vapi_assistant_id, full_name, phone_number')
      .eq('id', userId)
      .single()

    if (fetchError || !user?.vapi_assistant_id) {
      return {
        success: false,
        error: 'No voice agent found for user',
      }
    }

    // Update system prompt with new info
    const name = updates.name || user.full_name
    const phone = updates.phone || user.phone_number

    await vapi.updateAssistant(user.vapi_assistant_id, {
      model: {
        provider: 'anthropic',
        model: 'claude-sonnet-4',
        temperature: 0.7,
        systemPrompt: buildSystemPrompt(name, phone),
      },
    } as any)

    return {
      success: true,
      assistantId: user.vapi_assistant_id,
    }
  } catch (error) {
    console.error('[VAPI] Update failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
