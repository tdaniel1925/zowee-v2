import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function GET() {
  const modelsToTest = [
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-latest',
  ]

  const results: Record<string, any> = {}

  for (const model of modelsToTest) {
    try {
      console.log(`[Model Test] Testing: ${model}`)
      const response = await anthropic.messages.create({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      })

      results[model] = {
        success: true,
        response: response.content[0].type === 'text' ? response.content[0].text : 'non-text',
      }
      console.log(`[Model Test] ✓ ${model} works!`)
    } catch (error: any) {
      results[model] = {
        success: false,
        error: error.message,
        status: error.status,
      }
      console.log(`[Model Test] ✗ ${model} failed: ${error.message}`)
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    working_models: Object.entries(results)
      .filter(([_, v]) => v.success)
      .map(([k]) => k),
  })
}
