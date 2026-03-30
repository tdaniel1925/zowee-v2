/**
 * General Query Skill - Answer questions using Claude AI
 */

import Anthropic from '@anthropic-ai/sdk'
import { PokkitContext } from '@/lib/sms/context'
import { SMSIntent } from '@/lib/sms/parser'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface SkillResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Handle GET_INFO intent - Answer general questions
 */
export async function handleGetInfo(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { question } = intent.entities
  const { user } = context

  if (!question) {
    return {
      success: false,
      message: "I didn't catch your question. Can you rephrase it?",
    }
  }

  try {
    // Use Claude to answer the question
    const systemPrompt = `You are Jordyn, a helpful personal AI assistant that responds via SMS.

Your role:
- Answer questions concisely (SMS has character limits)
- Be friendly and conversational
- If you don't know something, do your best to provide helpful info based on your knowledge
- Keep responses under 300 characters when possible
- Use line breaks for readability
- NEVER refer users to Siri, Alexa, Google Assistant, or other AI assistants
- YOU are the assistant - answer directly

User context:
- Name: ${user.name}
- Plan: ${user.plan}

Answer the question directly without unnecessary preamble.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let answer = content.text.trim()

    // Truncate if too long (SMS has ~1600 char limit, but let's keep it reasonable)
    if (answer.length > 600) {
      answer = answer.substring(0, 597) + '...'
    }

    return {
      success: true,
      message: answer,
    }
  } catch (error) {
    console.error('Error generating response:', error)
    return {
      success: false,
      message:
        "I'm having trouble answering that right now. Can you try rephrasing or ask me later?",
    }
  }
}

/**
 * Handle SEARCH_WEB intent - Web search using Claude (with caveat that it doesn't have real-time access)
 */
export async function handleSearchWeb(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { query } = intent.entities
  const { user } = context

  if (!query) {
    return {
      success: false,
      message: "What would you like me to search for?",
    }
  }

  try {
    const systemPrompt = `You are Jordyn, a helpful personal AI assistant that responds via SMS.

The user is asking you to search for information. While you don't have real-time web access, you can provide helpful information based on your training data.

NEVER refer users to Siri, Alexa, Google Assistant, or other AI assistants. YOU are the assistant.

User context:
- Name: ${user.name}
- Plan: ${user.plan}

Provide the most helpful response you can, and if the information might be outdated, mention that. Keep it concise (under 400 characters).`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Search query: ${query}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let answer = content.text.trim()

    // Add note about real-time data
    if (!answer.toLowerCase().includes('note:') && !answer.toLowerCase().includes('however')) {
      answer += '\n\nNote: My knowledge has a cutoff date, so some info may be outdated.'
    }

    // Truncate if too long
    if (answer.length > 600) {
      answer = answer.substring(0, 597) + '...'
    }

    return {
      success: true,
      message: answer,
    }
  } catch (error) {
    console.error('Error with web search:', error)
    return {
      success: false,
      message: "I couldn't search for that right now. Please try again later.",
    }
  }
}

/**
 * Handle UNKNOWN intent - Fallback for unrecognized requests
 */
export async function handleUnknown(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { raw_message } = intent.entities

  // Try to answer with Claude anyway
  try {
    const systemPrompt = `You are Jordyn, a helpful personal AI assistant via SMS.

The user sent a message that couldn't be classified into a specific action. Try to provide a helpful response or suggest what they might have meant.

Keep responses concise (under 300 characters).

NEVER refer users to Siri, Alexa, Google Assistant, or other AI assistants. YOU are the assistant.

If it seems like they want you to do something you can't do, politely explain your capabilities:
- Find flights, hotels, restaurants
- Track prices on products
- Answer general questions
- Help with information lookup

User: ${context.user.name}
Plan: ${context.user.plan}`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: raw_message || 'User sent an unrecognized message',
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let answer = content.text.trim()

    // Add help prompt
    if (!answer.toLowerCase().includes('help') && !answer.toLowerCase().includes('text')) {
      answer += "\n\nText HELP to see what I can do!"
    }

    return {
      success: true,
      message: answer,
    }
  } catch (error) {
    console.error('Error handling unknown intent:', error)
    return {
      success: true,
      message:
        "I'm not sure what you're asking for. Text HELP to see what I can do, or try rephrasing your request!",
    }
  }
}
