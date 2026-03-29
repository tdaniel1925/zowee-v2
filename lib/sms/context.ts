/**
 * SMS Context Loader for Pokkit
 * Loads user context needed for intent parsing and skill execution
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface PokkitContext {
  user: any
  activeMonitors: any[]
  recentConversations: any[]
  preferences: any
  contacts: any[]
}

/**
 * Load full user context for SMS processing
 */
export async function loadUserContext(
  userId: string,
  supabase: SupabaseClient<any>
): Promise<PokkitContext> {
  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('jordyn_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new Error(`User not found: ${userId}`)
    }

    // Get active monitors
    const { data: monitors } = await supabase
      .from('jordyn_monitors')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Get recent conversations (last 10)
    const { data: conversations } = await supabase
      .from('jordyn_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get user preferences from memory
    const { data: memoryItems } = await supabase
      .from('jordyn_memory')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    // Parse preferences
    const preferences: any = {}
    const contacts: any[] = []

    memoryItems?.forEach((item) => {
      if (item.category === 'preference') {
        preferences[item.key] = item.value
      } else if (item.category === 'contact') {
        contacts.push({
          name: item.key,
          ...JSON.parse(item.value),
        })
      }
    })

    return {
      user,
      activeMonitors: monitors || [],
      recentConversations: conversations || [],
      preferences,
      contacts,
    }
  } catch (error) {
    console.error('Error loading user context:', error)
    throw error
  }
}

/**
 * Save conversation to database
 */
export async function saveConversation(
  userId: string,
  messageIn: string,
  messageOut: string,
  intent: string,
  skillUsed: string,
  processingMs: number,
  twilioSid: string,
  supabase: SupabaseClient<any>
): Promise<void> {
  try {
    await supabase.from('jordyn_conversations').insert({
      user_id: userId,
      channel: 'sms',
      direction: 'inbound',
      message_in: messageIn,
      message_out: messageOut,
      intent,
      skill_used: skillUsed,
      twilio_sid: twilioSid,
      processing_ms: processingMs,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving conversation:', error)
    // Don't throw - logging failure shouldn't break the flow
  }
}
