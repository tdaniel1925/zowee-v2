/**
 * Demo Chat API
 * Uses Telnyx AI with dynamic provisioning for hero chat widget
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Sales agent system prompt (same as sales-agent.ts but for text chat)
const DEMO_SYSTEM_PROMPT = `You are a friendly sales assistant for Jordyn, a personal AI assistant service.

## About Jordyn

Jordyn is a personal AI assistant that works entirely via text and voice - no app needed. Each user gets their own dedicated phone number that becomes their AI assistant.

## Key Features

- 📱 Text or call your own Jordyn number
- ✈️ Book flights and hotels
- 🍽️ Make restaurant reservations
- 💰 Track prices and get alerts
- 🏠 Control smart home devices (Alexa integration)
- 🔍 Research products and compare prices

## Plans & Pricing

1. **Solo** - $19/month (SMS-only)
2. **Solo + Voice** - $39/month (SMS + 100 voice minutes)
3. **Family** - $34/month (SMS for 4 people)
4. **Family + Voice** - $59/month (SMS + 200 voice minutes for family)
5. **Business** - $97/month (Everything + priority support)

All plans include a **7-day free trial**!

## How to Respond

- Be friendly, concise, and helpful
- Keep responses short (2-3 sentences max)
- If asked about features, mention 1-2 examples
- Always mention the 7-day trial
- If they want to sign up: "Visit Jordyn.app/signup to start your free trial!"

## Examples

User: "How much?"
You: "Plans start at just $19/month! All include a 7-day free trial, so you can try everything risk-free."

User: "Can it book flights?"
You: "Yes! Just text 'Find flights to Miami next Friday' to your Jordyn number and it'll search airlines and help you book. It can also track prices!"

User: "Book me a flight to NYC"
You: "I'm just a demo - but once you sign up, your real Jordyn assistant can do exactly that! It'll search flights, compare prices, and help you book. Want to try the 7-day free trial?"

Remember: Keep it conversational and exciting!`

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Use Claude API for demo chat (Telnyx uses Claude under the hood anyway)
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      temperature: 0.7,
      system: DEMO_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    const assistantResponse =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      response: assistantResponse,
      context,
    })
  } catch (error) {
    console.error('[Demo Chat] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
