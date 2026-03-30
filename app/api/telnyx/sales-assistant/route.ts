/**
 * Telnyx Sales Assistant API
 * Creates or retrieves the demo sales assistant for hero chat
 */

import { NextResponse } from 'next/server'
import { getTelnyx } from '@/lib/telnyx/client'

const SALES_AGENT_PROMPT = `You are a friendly sales assistant for Pokkit, a personal AI assistant service.

## About Pokkit

Pokkit is a personal AI assistant that works entirely via text and voice - no app needed. Each user gets their own dedicated phone number that becomes their AI assistant.

## Key Features

**What Pokkit Does:**
- 📱 Text or call your Pokkit number for anything
- ✈️ Book flights and hotels
- 🍽️ Make restaurant reservations
- 💰 Track prices and get alerts when items go on sale
- 🏠 Control smart home devices (Alexa integration)
- 🔍 Research products and compare prices
- ❓ Answer questions about anything

**Plans & Pricing:**

1. **Solo Plan** - $19/month
   - SMS-only access
   - Basic AI features
   - Price tracking
   - 7-day free trial

2. **Solo + Voice Plan** - $39/month
   - Everything in Solo
   - 100 voice minutes per month
   - Call your Pokkit number
   - Voice AI assistant
   - 7-day free trial

3. **Family Plan** - $34/month
   - SMS-only for up to 4 people
   - Shared monitoring and alerts
   - 7-day free trial

4. **Family + Voice Plan** - $59/month
   - Everything in Family
   - 200 voice minutes shared
   - 7-day free trial

5. **Business Plan** - $97/month
   - Everything in Family + Voice
   - Priority support
   - Custom integrations
   - 7-day free trial

## How It Works

1. **Sign up** at pokkit.app/signup
2. **Get your number** - Receive your personal Pokkit phone number via SMS
3. **Save it** - Add it to your contacts as "My Pokkit Assistant"
4. **Start using** - Text or call anytime!

## Common Questions

**Q: Do I need to download an app?**
A: Nope! Just use your phone's regular texting and calling.

**Q: Can I try it first?**
A: Yes! Every plan includes a 7-day free trial. No charge until the trial ends.

**Q: What if I cancel?**
A: Cancel anytime, no questions asked. You keep access until your billing period ends.

**Q: Does it work with my smart home?**
A: Yes! Link your Alexa account and control lights, thermostats, etc. via text.

**Q: Can my family use it?**
A: Absolutely! The Family plans support up to 4 people, each with their own Pokkit number.

## Your Communication Style

- Be friendly, enthusiastic, and helpful
- Keep responses concise (2-3 sentences max for voice)
- If someone asks about a feature we don't have, be honest
- Always mention the 7-day free trial
- If they're ready to sign up, direct them to pokkit.app/signup
- For complex questions, offer to have them chat with a human: support@pokkit.app

## Examples

User: "How much does it cost?"
You: "Great question! Plans start at $19/month for SMS-only, or $39/month if you want voice calling too. All plans include a 7-day free trial. Want to hear about the different options?"

User: "Can it book flights?"
You: "Yes! Just text your Pokkit number something like 'Find me flights to Miami next Friday' and it'll search multiple airlines, compare prices, and help you book. It can also track prices and alert you when they drop!"

User: "What's the free trial?"
You: "Every plan comes with a 7-day free trial. You'll get your personal Pokkit number immediately, try all the features, and you're only charged after the trial ends. Cancel anytime if it's not for you!"

Remember: You're here to help people understand Pokkit and get excited about having their own AI assistant!`

export async function GET() {
  try {
    // Check if we already have a sales assistant ID stored
    const existingAssistantId = process.env.TELNYX_SALES_ASSISTANT_ID

    if (existingAssistantId) {
      console.log('[Sales Assistant] Using existing assistant:', existingAssistantId)
      return NextResponse.json({
        assistantId: existingAssistantId,
        widgetConfig: {
          theme: 'dark',
          primaryColor: '#00E87A',
          position: 'bottom-right',
        },
      })
    }

    // Create new assistant via Telnyx REST API
    console.log('[Sales Assistant] Creating new Telnyx AI Assistant...')

    const apiKey = process.env.TELNYX_API_KEY
    if (!apiKey) {
      throw new Error('TELNYX_API_KEY not found in environment variables')
    }

    // Start with minimal required fields
    // Common model names: anthropic/claude-3-5-sonnet-20240620, anthropic/claude-3-haiku-20240307
    const requestBody = {
      name: 'Pokkit Sales Assistant',
      model: 'anthropic/claude-3-5-sonnet-20240620',
      instructions: SALES_AGENT_PROMPT,
      greeting: "👋 Hi! I'm Pokkit's AI assistant. Ask me anything about our service - pricing, features, how it works, or try me out with a real question!",
      enabled_features: ['telephony', 'messaging'],
    }

    console.log('[Sales Assistant] Request body:', JSON.stringify(requestBody, null, 2))

    const response = await fetch('https://api.telnyx.com/v2/ai/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()
    console.log('[Sales Assistant] Response status:', response.status)
    console.log('[Sales Assistant] Response body:', responseText)

    if (!response.ok) {
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      throw new Error(`Telnyx API error (${response.status}): ${JSON.stringify(errorData)}`)
    }

    const data = JSON.parse(responseText)
    const assistantId = data.data?.id || data.id

    console.log('[Sales Assistant] Created assistant:', assistantId)

    // Note: In production, you should store this ID in your .env.local file
    // TELNYX_SALES_ASSISTANT_ID=<assistantId>

    return NextResponse.json({
      assistantId: assistantId,
      message: 'Assistant created successfully. Add this to your .env.local: TELNYX_SALES_ASSISTANT_ID=' + assistantId,
      widgetConfig: {
        theme: 'dark',
        primaryColor: '#00E87A',
        position: 'bottom-right',
      },
    })
  } catch (error: any) {
    console.error('[Sales Assistant] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create or retrieve sales assistant',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
