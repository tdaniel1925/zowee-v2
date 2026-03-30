import { anthropic } from './anthropic'

export type Intent =
  | 'booking_flight'
  | 'booking_hotel'
  | 'booking_restaurant'
  | 'monitor_price'
  | 'monitor_flight'
  | 'reminder'
  | 'research'
  | 'question'
  | 'help'
  | 'cancel'
  | 'unknown'

export interface IntentResult {
  intent: Intent
  confidence: number
  entities: Record<string, any>
  explanation: string
}

/**
 * Detect user intent from message using Claude
 */
export async function detectIntent(
  message: string,
  conversationHistory?: string[]
): Promise<IntentResult> {
  const systemPrompt = `You are an intent classifier for Pokkit, an SMS-based AI assistant.

Analyze the user's message and return a JSON object with:
{
  "intent": "<intent_type>",
  "confidence": <0-100>,
  "entities": { <extracted_entities> },
  "explanation": "<brief_explanation>"
}

Intent types:
- booking_flight: User wants to book a flight
- booking_hotel: User wants to book a hotel
- booking_restaurant: User wants to book a restaurant/table
- monitor_price: User wants to track a product price
- monitor_flight: User wants to monitor flight prices
- reminder: User wants to set a reminder
- research: User wants research done on a topic
- question: User is asking a general question
- help: User needs help understanding what Pokkit can do
- cancel: User wants to cancel subscription or a service
- unknown: Cannot determine intent

Extract relevant entities like:
- destination, origin (for flights)
- product_name, target_price (for monitoring)
- reminder_time, reminder_text (for reminders)
- restaurant_name, party_size, date_time (for restaurants)

Return ONLY valid JSON, no other text.`

  const userPrompt = conversationHistory
    ? `Recent conversation:\n${conversationHistory.join('\n')}\n\nLatest message: "${message}"`
    : `Message: "${message}"`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
      explanation: 'Could not parse response',
    }
  }

  try {
    const result = JSON.parse(content.text)
    return result as IntentResult
  } catch (error) {
    console.error('Failed to parse intent:', content.text)
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
      explanation: 'Failed to parse intent',
    }
  }
}

/**
 * Generate a conversational response based on intent
 */
export async function generateResponse(
  intent: IntentResult,
  userMessage: string,
  userName: string,
  planStatus: string
): Promise<string> {
  const systemPrompt = `You are Pokkit, a friendly and helpful AI assistant that works via SMS.

You help users with:
- Booking flights, hotels, and restaurants
- Monitoring prices for products and flights
- Setting reminders
- Researching topics and answering questions
- General assistance

Keep responses:
- Concise (ideally under 160 characters, max 300)
- Friendly and conversational
- Actionable (tell them what happens next)
- Use emojis sparingly (1-2 max)

User context:
- Name: ${userName}
- Plan status: ${planStatus}

Intent detected: ${intent.intent}
Confidence: ${intent.confidence}%
Entities: ${JSON.stringify(intent.entities)}

Based on this intent, craft an appropriate response.`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  })

  const content = response.content[0]
  if (content.type === 'text') {
    return content.text
  }

  return "I'm here to help! What can I do for you?"
}
