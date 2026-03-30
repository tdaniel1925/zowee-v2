/**
 * Browserbase Task Executor
 * Processes pending browser tasks using Browserbase + Claude Computer Use
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getPendingBrowserTasks, completeBrowserTask, failBrowserTask } from './session'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID

/**
 * Execute pending browser tasks
 */
export async function executePendingTasks(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  try {
    // Get pending tasks
    const tasks = await getPendingBrowserTasks(supabase, 5)

    if (tasks.length === 0) {
      console.log('[Browser Executor] No pending tasks')
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    console.log(`[Browser Executor] Processing ${tasks.length} pending tasks`)

    let succeeded = 0
    let failed = 0

    for (const task of tasks) {
      try {
        console.log(`[Browser Executor] Processing task ${task.id} (${task.task_type})`)

        // For now, use Claude directly without actual browser automation
        // This is a simplified implementation until full Browserbase integration
        const result = await executeTaskWithClaude(task)

        await completeBrowserTask(task.id, result, undefined, supabase)
        succeeded++

        console.log(`[Browser Executor] ✓ Task ${task.id} completed successfully`)
      } catch (error: any) {
        console.error(`[Browser Executor] ✗ Task ${task.id} failed:`, error.message)

        await failBrowserTask(
          task.id,
          error.message || 'Task execution failed',
          supabase
        )
        failed++
      }
    }

    return {
      processed: tasks.length,
      succeeded,
      failed,
    }
  } catch (error) {
    console.error('[Browser Executor] Fatal error:', error)
    return { processed: 0, succeeded: 0, failed: 0 }
  }
}

/**
 * Execute task using Claude (simplified version without actual browser)
 * TODO: Replace with full Browserbase + Claude Computer Use integration
 */
async function executeTaskWithClaude(task: any): Promise<any> {
  const systemPrompt = `You are a research assistant. The user asked you to research: "${task.instructions}"

Provide a helpful, detailed response based on your knowledge. Format as JSON with this structure:
{
  "findings": [
    {
      "title": "Finding title",
      "details": "Detailed information",
      "source": "Source/reasoning"
    }
  ],
  "summary": "Brief 2-3 sentence summary of findings"
}`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 2048,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: task.instructions || 'Research the topic',
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Try to parse as JSON
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    // If JSON parsing fails, return text as summary
  }

  // Fallback: return as summary
  return {
    findings: [],
    summary: content.text.trim(),
  }
}
