import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing env.ANTHROPIC_API_KEY')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Helper to process user messages with Claude
export async function processWithClaude(
  userMessage: string,
  systemPrompt?: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt || 'You are Pokkit, a helpful AI assistant that helps users via SMS.',
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === 'text') {
    return content.text
  }

  return 'I apologize, but I encountered an error processing your request.'
}
