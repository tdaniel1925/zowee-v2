/**
 * VAPI Client Wrapper
 * Handles all interactions with the VAPI (Voice AI Platform Integration) API
 */

interface VapiAssistant {
  id: string
  name: string
  model: {
    provider: string
    model: string
    systemPrompt: string
    temperature: number
  }
  voice: {
    provider: string
    voiceId: string
  }
  transcriber: {
    provider: string
    model: string
    language: string
  }
  serverUrl?: string
  serverUrlSecret?: string
}

interface VapiPhoneNumber {
  id: string
  number: string
  assistantId?: string
}

interface VapiCall {
  id: string
  assistantId: string
  phoneNumberId: string
  customer: {
    number: string
  }
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended'
  startedAt?: string
  endedAt?: string
  duration?: number
  transcript?: string
  summary?: string
}

let vapiApiKey: string | null = null

function getVapiApiKey(): string {
  if (!vapiApiKey) {
    if (!process.env.VAPI_API_KEY) {
      throw new Error('Missing env.VAPI_API_KEY')
    }
    vapiApiKey = process.env.VAPI_API_KEY
  }
  return vapiApiKey
}

const VAPI_BASE_URL = 'https://api.vapi.ai'

async function vapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getVapiApiKey()

  const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export const vapi = {
  /**
   * Create a new assistant for a user
   */
  async createAssistant(config: {
    name: string
    userId: string
    systemPrompt: string
  }): Promise<VapiAssistant> {
    return vapiRequest<VapiAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        model: {
          provider: 'anthropic',
          model: 'claude-sonnet-4',
          temperature: 0.7,
          systemPrompt: config.systemPrompt,
        },
        voice: {
          provider: '11labs',
          voiceId: 'rachel', // Professional, friendly voice
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      }),
    })
  },

  /**
   * Get assistant by ID
   */
  async getAssistant(assistantId: string): Promise<VapiAssistant> {
    return vapiRequest<VapiAssistant>(`/assistant/${assistantId}`, {
      method: 'GET',
    })
  },

  /**
   * Update an existing assistant
   */
  async updateAssistant(
    assistantId: string,
    updates: Partial<VapiAssistant>
  ): Promise<VapiAssistant> {
    return vapiRequest<VapiAssistant>(`/assistant/${assistantId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Delete an assistant
   */
  async deleteAssistant(assistantId: string): Promise<void> {
    return vapiRequest<void>(`/assistant/${assistantId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Create or get a phone number for a user
   */
  async importPhoneNumber(twilioNumber: string): Promise<VapiPhoneNumber> {
    return vapiRequest<VapiPhoneNumber>('/phone-number', {
      method: 'POST',
      body: JSON.stringify({
        provider: 'twilio',
        number: twilioNumber,
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      }),
    })
  },

  /**
   * Link an assistant to a phone number
   */
  async linkAssistantToNumber(
    phoneNumberId: string,
    assistantId: string
  ): Promise<VapiPhoneNumber> {
    return vapiRequest<VapiPhoneNumber>(`/phone-number/${phoneNumberId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        assistantId,
      }),
    })
  },

  /**
   * Get call details
   */
  async getCall(callId: string): Promise<VapiCall> {
    return vapiRequest<VapiCall>(`/call/${callId}`, {
      method: 'GET',
    })
  },

  /**
   * List all calls for an assistant
   */
  async listCalls(assistantId: string): Promise<VapiCall[]> {
    return vapiRequest<VapiCall[]>(`/call?assistantId=${assistantId}`, {
      method: 'GET',
    })
  },
}
