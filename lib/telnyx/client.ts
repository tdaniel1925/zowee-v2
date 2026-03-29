/**
 * Telnyx Client
 * Unified client for Telnyx SMS, Voice, and Phone Number APIs
 */

import Telnyx from 'telnyx'

let telnyxInstance: Telnyx | null = null

/**
 * Get or create Telnyx client instance
 */
export function getTelnyx(): Telnyx {
  if (!telnyxInstance) {
    const apiKey = process.env.TELNYX_API_KEY
    if (!apiKey) {
      throw new Error('TELNYX_API_KEY is required')
    }
    telnyxInstance = new Telnyx({ apiKey })
  }
  return telnyxInstance
}

/**
 * Telnyx client singleton
 */
export const telnyx = getTelnyx()
