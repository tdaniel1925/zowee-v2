/**
 * Telnyx Client
 * Unified client for Telnyx SMS, Voice, and Phone Number APIs
 */

import Telnyx from 'telnyx'

let telnyxInstance: Telnyx | null = null

/**
 * Get or create Telnyx client instance
 * Lazy initialization - only creates client when first accessed
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
 * Telnyx client singleton (lazy)
 * Use getter to avoid initialization at build time
 */
export const telnyx = new Proxy({} as Telnyx, {
  get: (target, prop) => {
    const client = getTelnyx()
    return (client as any)[prop]
  }
})
