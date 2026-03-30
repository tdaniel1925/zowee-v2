/**
 * SMS Intent Parser for Pokkit
 * Uses Claude AI to parse natural language SMS into structured intents
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Pokkit intent types
export type PokkitIntent =
  // TRAVEL
  | 'FIND_FLIGHT'
  | 'FIND_HOTEL'
  | 'BOOK_TRAVEL'
  // DINING
  | 'FIND_RESTAURANT'
  | 'BOOK_RESERVATION'
  // PRICE TRACKING
  | 'TRACK_PRICE'
  | 'CHECK_MONITORS'
  | 'STOP_TRACKING'
  // RESEARCH (Browserbase)
  | 'RESEARCH_PRICES'
  | 'RESEARCH_REVIEWS'
  | 'RESEARCH_OPTIONS'
  | 'RESEARCH_INFO'
  // FORMS (Browserbase)
  | 'FILL_BOOKING_FORM'
  | 'FILL_SEARCH_FORM'
  | 'FILL_CONTACT_FORM'
  | 'FILL_APPLICATION'
  // PAYMENTS (Browserbase)
  | 'PROCESS_PAYMENT'
  | 'AUTHORIZE_PURCHASE'
  | 'CONFIRM_BOOKING'
  | 'CANCEL_PAYMENT'
  // GENERAL
  | 'GET_INFO'
  | 'SEARCH_WEB'
  | 'SEARCH_YOUTUBE'
  // SMART HOME (Alexa)
  | 'SMART_HOME_CONTROL'
  // CONTROL
  | 'PAUSE_SERVICE'
  | 'RESUME_SERVICE'
  | 'CHECK_STATUS'
  | 'HELP'
  // UNKNOWN
  | 'UNKNOWN'

export interface SMSIntent {
  intent: PokkitIntent
  confidence: number
  entities: Record<string, any>
  requires_confirmation: boolean
  is_urgent: boolean
}

/**
 * Parse SMS message into structured intent
 */
export async function parseSMSIntent(
  message: string,
  context: any
): Promise<SMSIntent> {
  try {
    const systemPrompt = `You are an expert at parsing natural language commands for Pokkit, a personal AI assistant via SMS.

Given a text message from a user, classify the intent and extract relevant entities.

Intent Categories:
- TRAVEL: FIND_FLIGHT, FIND_HOTEL, BOOK_TRAVEL
- DINING: FIND_RESTAURANT, BOOK_RESERVATION
- PRICE_TRACKING: TRACK_PRICE, CHECK_MONITORS, STOP_TRACKING
- RESEARCH: RESEARCH_PRICES (compare prices across sites), RESEARCH_REVIEWS (read reviews), RESEARCH_OPTIONS (find best options), RESEARCH_INFO (general research)
- FORMS: FILL_BOOKING_FORM (restaurant/hotel bookings), FILL_SEARCH_FORM (flight/hotel searches), FILL_CONTACT_FORM, FILL_APPLICATION
- PAYMENTS: PROCESS_PAYMENT, AUTHORIZE_PURCHASE, CONFIRM_BOOKING, CANCEL_PAYMENT
- GENERAL: GET_INFO, SEARCH_WEB, SEARCH_YOUTUBE (for "how to" tutorials)
- SMART_HOME: SMART_HOME_CONTROL (control Alexa devices like lights, thermostat, locks)
- CONTROL: PAUSE_SERVICE, RESUME_SERVICE, CHECK_STATUS, HELP
- UNKNOWN: Anything that doesn't match above

Entity Extraction:
For FIND_FLIGHT extract: destination (city/airport), origin (if mentioned), date (ISO format or relative like "tomorrow" or "next Friday"), return_date (if round trip), max_price (number), flexibility (exact_date/flexible)
For FIND_HOTEL extract: location (city), check_in (ISO format), check_out (ISO format), max_price_per_night (number), guests (number)
For FIND_RESTAURANT extract: cuisine (type), location (address/neighborhood/"near me"), date (ISO format or "today"/"tomorrow"), time (24h format like "19:00"), party_size (number)
For TRACK_PRICE extract: product (item name), threshold (number), direction ("below"/"above"), url (if provided)
For CHECK_MONITORS: No entities needed
For STOP_TRACKING extract: product (item name or monitor_id)
For PAUSE_SERVICE extract: duration (e.g., "2 hours", "30 minutes")
For GET_INFO extract: question (the actual question)
For SEARCH_WEB extract: query (search query)
For SEARCH_YOUTUBE extract: query (what to learn - e.g., "how to make pasta carbonara", "how to change a tire")
For SMART_HOME_CONTROL extract: action ("turn_on"/"turn_off"/"set"/"dim"/"lock"/"unlock"), device (device name like "living room lights", "thermostat", "front door"), value (for "set" actions like temperature or brightness level), room (if specified)
For RESEARCH_PRICES extract: product (item name), sites (array of site names like ["Amazon", "Best Buy"]), query
For RESEARCH_REVIEWS extract: product (item name), service (service name), query
For RESEARCH_OPTIONS extract: query (what to research), location (if applicable), criteria (any specific requirements)
For RESEARCH_INFO extract: query (research question)
For FILL_BOOKING_FORM extract: restaurant (name), party_size (number), date, time, special_requests, site (URL if mentioned)
For FILL_SEARCH_FORM extract: form_type ("flight"/"hotel"), origin, destination, departure_date, return_date, check_in, check_out, passengers, guests, rooms
For FILL_CONTACT_FORM extract: site (URL), message (message to send), subject
For PROCESS_PAYMENT extract: amount (number), merchant (merchant name), url (if provided)
For AUTHORIZE_PURCHASE/CONFIRM_BOOKING extract: amount (number), merchant, task_id (if referring to previous task)
For CANCEL_PAYMENT extract: task_id (if referring to pending payment)

Return ONLY valid JSON with this structure:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": { "key": "value" },
  "requires_confirmation": false,
  "is_urgent": false
}

Be precise. Extract dates, prices, locations, and other entities accurately.`

    const userPrompt = `User context:
- Name: ${context.user.name}
- Plan: ${context.user.plan}
- Active monitors: ${context.activeMonitors?.length || 0}

Message to parse:
"${message}"

Return JSON only:`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract JSON from response
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const intent = JSON.parse(jsonMatch[0]) as SMSIntent

    // Log parsed intent
    console.log('[Pokkit SMS Parser]', {
      raw_message: message,
      parsed_intent: intent.intent,
      confidence: intent.confidence,
      entities: intent.entities,
    })

    // Validate intent structure
    if (!intent.intent || typeof intent.confidence !== 'number') {
      throw new Error('Invalid intent structure')
    }

    return intent
  } catch (error) {
    console.error('SMS parsing error:', error)

    // Return UNKNOWN intent on error
    return {
      intent: 'UNKNOWN',
      confidence: 0.0,
      entities: { error: 'parsing_failed', raw_message: message },
      requires_confirmation: true,
      is_urgent: false,
    }
  }
}
