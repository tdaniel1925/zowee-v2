/**
 * Weather Skill - Get current weather information
 */

import Anthropic from '@anthropic-ai/sdk'
import { PokkitContext } from '@/lib/sms/context'
import { SMSIntent } from '@/lib/sms/parser'
import { SkillResult } from './executor'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/**
 * Handle GET_WEATHER intent
 */
export async function handleWeather(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { location } = intent.entities

  // If no location provided, ask for it
  if (!location) {
    return {
      success: true,
      message: "I'd love to check the weather for you! What's your zip code or city?",
    }
  }

  try {
    // Use Claude to provide weather info based on general knowledge
    // Note: For production, you'd integrate with OpenWeatherMap or similar API
    const systemPrompt = `You are Jordyn, a helpful personal AI assistant via SMS.

The user is asking about weather for: ${location}

Provide helpful weather information based on your knowledge:
- If you have general climate info for that location, share it
- Mention typical weather patterns for this time of year
- Be clear that you don't have real-time data
- Suggest checking weather.com or weather apps for current conditions
- Keep response under 300 characters

Be friendly and helpful despite limitations.`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `What's the weather like in ${location}?`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let answer = content.text.trim()

    // Truncate if too long
    if (answer.length > 600) {
      answer = answer.substring(0, 597) + '...'
    }

    return {
      success: true,
      message: answer,
    }
  } catch (error) {
    console.error('Error getting weather:', error)
    return {
      success: false,
      message: "I'm having trouble checking the weather right now. Please try again in a moment!",
    }
  }
}
