/**
 * Browserbase Research Skills
 * Handles research tasks (price comparison, reviews, options, general info)
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { SMSIntent } from '@/lib/sms/parser'
import { PokkitContext } from '@/lib/sms/context'
import { createBrowserTask } from '@/lib/browserbase/session'
import { SkillResult } from './executor'

/**
 * Handle all research-related intents
 */
export async function handleResearch(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { query, sites, product, location, service } = intent.entities

  // Build natural language instructions for Claude Computer Use
  const instructions = buildResearchInstructions(intent)

  // Create browser task
  try {
    const task = await createBrowserTask(
      {
        user_id: context.user.id,
        task_type: 'research',
        intent,
        instructions,
      },
      supabase
    )

    // Determine what we're researching for the response message
    const subject = product || service || query || 'that'

    return {
      success: true,
      message: `🔍 Researching ${subject} using live browser automation... I'll text you the results in 1-3 minutes!`,
      data: { task_id: task.id },
    }
  } catch (error) {
    console.error('Error creating research task:', error)
    return {
      success: false,
      message: "Sorry, I couldn't start the research task. Please try again.",
    }
  }
}

/**
 * Build research instructions for Claude Computer Use
 */
function buildResearchInstructions(intent: SMSIntent): string {
  const { query, sites, product, location, service, criteria, destination, origin, date, cuisine } =
    intent.entities

  let instructions = 'Research Task:\n\n'

  // Determine task type
  if (intent.intent === 'FIND_FLIGHT') {
    const dest = destination || 'the destination'
    const orig = origin || 'nearby airports'
    const dateStr = date ? ` on ${date}` : ''
    instructions += `Task: Research flights from ${orig} to ${dest}${dateStr}\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search Google Flights, Kayak, or Expedia for flight options\n`
    instructions += `2. Extract top 3-5 flight options with:\n`
    instructions += `   - Airline and flight number\n`
    instructions += `   - Departure/arrival times\n`
    instructions += `   - Duration and stops\n`
    instructions += `   - Price\n`
    instructions += `   - Booking URL\n`
    instructions += `3. Return JSON with findings array and summary\n\n`
  } else if (intent.intent === 'FIND_HOTEL') {
    const loc = location || destination || 'the area'
    instructions += `Task: Research hotels in ${loc}\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search Booking.com, Hotels.com, or Google Hotels\n`
    instructions += `2. Extract top 5 hotels with:\n`
    instructions += `   - Hotel name\n`
    instructions += `   - Price per night\n`
    instructions += `   - Rating and review count\n`
    instructions += `   - Location/address\n`
    instructions += `   - Amenities\n`
    instructions += `   - Booking URL\n`
    instructions += `3. Return JSON with findings array and summary\n\n`
  } else if (intent.intent === 'FIND_RESTAURANT') {
    const loc = location || 'nearby'
    const cuisineStr = cuisine ? `${cuisine} restaurants` : 'restaurants'
    instructions += `Task: Research ${cuisineStr} in ${loc}\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search Yelp, Google Maps, or OpenTable\n`
    instructions += `2. Extract top 5 restaurants with:\n`
    instructions += `   - Restaurant name\n`
    instructions += `   - Cuisine type\n`
    instructions += `   - Rating and review count\n`
    instructions += `   - Price range ($ to $$$$)\n`
    instructions += `   - Address\n`
    instructions += `   - Website/booking URL\n`
    instructions += `3. Return JSON with findings array and summary\n\n`
  } else if (intent.intent === 'RESEARCH_PRICES') {
    const searchTerm = product || query || 'the item'
    instructions += `Task: Compare prices for "${searchTerm}" across multiple sites\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search for "${searchTerm}" on ${sites?.join(', ') || 'Amazon, Best Buy, Walmart'}\n`
    instructions += `2. For each site, extract:\n`
    instructions += `   - Product name\n`
    instructions += `   - Price\n`
    instructions += `   - Availability (in stock / out of stock / limited)\n`
    instructions += `   - Shipping info (if available)\n`
    instructions += `   - Rating and review count\n`
    instructions += `   - Product URL\n`
    instructions += `3. Return JSON with findings array and summary\n\n`
  } else if (intent.intent === 'RESEARCH_REVIEWS') {
    const searchTerm = product || service || query || 'the item'
    instructions += `Task: Research reviews and ratings for "${searchTerm}"\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search for "${searchTerm}" reviews on Google, Amazon, Yelp, etc.\n`
    instructions += `2. Extract:\n`
    instructions += `   - Overall rating\n`
    instructions += `   - Number of reviews\n`
    instructions += `   - Common pros (top 3)\n`
    instructions += `   - Common cons (top 3)\n`
    instructions += `   - Expert review summary (if available)\n`
    instructions += `3. Return JSON with findings and summary\n\n`
  } else if (intent.intent === 'RESEARCH_OPTIONS') {
    const searchTerm = query || service || 'options'
    instructions += `Task: Research options for "${searchTerm}"\n\n`
    if (location) {
      instructions += `Location: ${location}\n`
    }
    if (criteria) {
      instructions += `Criteria: ${JSON.stringify(criteria)}\n`
    }
    instructions += `\nSteps:\n`
    instructions += `1. Search for the best options using Google, Yelp, TripAdvisor, etc.\n`
    instructions += `2. For each option, extract:\n`
    instructions += `   - Name\n`
    instructions += `   - Rating and review count\n`
    instructions += `   - Price range or specific price\n`
    instructions += `   - Location/availability\n`
    instructions += `   - Key details\n`
    instructions += `   - URL\n`
    instructions += `3. Return top 5-10 options with summary\n\n`
  } else {
    // RESEARCH_INFO or general research - fallback
    const searchTerm = query || product || service || destination || 'this topic'
    instructions += `Task: Research and provide information about "${searchTerm}"\n\n`
    instructions += `Steps:\n`
    instructions += `1. Search multiple reliable sources\n`
    instructions += `2. Extract key information, facts, and data\n`
    instructions += `3. Synthesize findings into a clear summary\n`
    instructions += `4. Include sources (URLs)\n\n`
  }

  instructions += `Output Format:\n`
  instructions += `Return JSON with this structure:\n`
  instructions += `{\n`
  instructions += `  "findings": [\n`
  instructions += `    {\n`
  instructions += `      "site": "Site name",\n`
  instructions += `      "title": "Item/option title",\n`
  instructions += `      "price": "$XX.XX",\n`
  instructions += `      "rating": "4.5/5",\n`
  instructions += `      "availability": "In stock",\n`
  instructions += `      "url": "https://...",\n`
  instructions += `      "details": { ...additional data... }\n`
  instructions += `    }\n`
  instructions += `  ],\n`
  instructions += `  "summary": "Brief summary in 1-2 sentences",\n`
  instructions += `  "sources": ["url1", "url2"]\n`
  instructions += `}\n`

  return instructions
}

/**
 * Format research results for SMS
 */
export function formatResearchResults(task: any): string {
  const result = task.result

  if (!result || !result.findings) {
    return '❌ Research completed but no results found.'
  }

  let message = `🔍 Research Results:\n\n`

  // Show top 3-5 findings
  const findings = result.findings.slice(0, 5)
  findings.forEach((finding: any, index: number) => {
    const num = index + 1
    message += `${num}. ${finding.title || finding.site}\n`

    if (finding.price) {
      message += `   ${finding.price}`
    }
    if (finding.rating) {
      message += ` · ${finding.rating}`
    }
    if (finding.availability) {
      message += ` · ${finding.availability}`
    }
    message += `\n`
  })

  if (result.summary) {
    message += `\n${result.summary}`
  }

  // Truncate if too long
  if (message.length > 600) {
    message = message.substring(0, 597) + '...'
  }

  return message
}
