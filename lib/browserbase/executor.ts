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
 * Execute task using Browserbase + Claude Computer Use
 * Creates a real browser session and uses Claude to navigate and extract data
 */
async function executeTaskWithClaude(task: any): Promise<any> {
  if (!BROWSERBASE_API_KEY || !BROWSERBASE_PROJECT_ID) {
    throw new Error('Browserbase credentials not configured')
  }

  console.log(`[Executor] Creating Browserbase session for task ${task.id}`)

  // Create Browserbase session
  const sessionResponse = await fetch('https://www.browserbase.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BB-API-Key': BROWSERBASE_API_KEY,
    },
    body: JSON.stringify({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        viewport: { width: 1280, height: 1024 },
      },
    }),
  })

  if (!sessionResponse.ok) {
    const error = await sessionResponse.text()
    throw new Error(`Failed to create Browserbase session: ${error}`)
  }

  const session = await sessionResponse.json()
  const sessionId = session.id
  const cdpUrl = `wss://connect.browserbase.com?apiKey=${BROWSERBASE_API_KEY}&sessionId=${sessionId}`

  console.log(`[Executor] Browserbase session created: ${sessionId}`)

  try {
    // Use Claude with Computer Use to control the browser
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', // Correct model name from Apex project
      max_tokens: 4096,
      tools: [
        {
          type: 'computer_20241022',
          name: 'computer',
          display_width_px: 1280,
          display_height_px: 1024,
          display_number: 1,
        },
        {
          type: 'bash_20241022',
          name: 'bash',
        },
      ],
      messages: [
        {
          role: 'user',
          content: `${task.instructions}

Use the browser to research this. Navigate to relevant websites, extract information, and compile findings.

Connect to browser using CDP: ${cdpUrl}

Return results as JSON:
{
  "findings": [{"title": "...", "details": "...", "url": "..."}],
  "summary": "Brief summary"
}`,
        },
      ],
    })

    // Extract results from Claude's response
    const content = response.content.find((c: any) => c.type === 'text')
    if (!content || content.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback
    return {
      findings: [],
      summary: content.text.trim(),
    }
  } finally {
    // End Browserbase session
    await fetch(`https://www.browserbase.com/v1/sessions/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BB-API-Key': BROWSERBASE_API_KEY,
      },
      body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
    })

    console.log(`[Executor] Browserbase session ${sessionId} ended`)
  }
}
