/**
 * Browserbase Task Executor
 * Processes pending browser tasks using Browserbase + Claude
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getPendingBrowserTasks, completeBrowserTask, failBrowserTask } from './session'
import { chromium } from 'playwright-core'

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
    // Connect to Browserbase browser using Playwright
    console.log(`[Executor] Connecting to browser via CDP: ${cdpUrl}`)
    const browser = await chromium.connectOverCDP(cdpUrl)
    const context = browser.contexts()[0]
    const page = context.pages()[0]

    console.log(`[Executor] Browser connected, executing research task`)

    // Use Claude to guide the research with access to live page content
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${task.instructions}

You are helping with web research. I will provide you with page content from live websites.

Analyze the task and tell me:
1. Which websites to visit (provide URLs)
2. What data to extract from each site

Format your response as JSON:
{
  "sites_to_visit": ["url1", "url2", "url3"],
  "data_to_extract": ["field1", "field2", "field3"]
}`,
        },
      ],
    })

    // Extract Claude's plan
    const planContent = response.content.find((c: any) => c.type === 'text')
    if (!planContent || planContent.type !== 'text') {
      throw new Error('No plan from Claude')
    }

    const planMatch = planContent.text.match(/\{[\s\S]*\}/)
    let plan: any = { sites_to_visit: [], data_to_extract: [] }

    if (planMatch) {
      try {
        plan = JSON.parse(planMatch[0])
      } catch (e) {
        console.error('[Executor] Failed to parse plan JSON')
      }
    }

    // Visit sites and collect data
    const findings: any[] = []
    const sitesToVisit = plan.sites_to_visit?.slice(0, 3) || [] // Limit to 3 sites for speed

    for (const url of sitesToVisit) {
      try {
        console.log(`[Executor] Visiting: ${url}`)
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })
        await page.waitForTimeout(2000) // Let JS load

        // Extract page content
        const pageText = await page.evaluate(() => {
          // Remove script and style tags
          const scripts = document.querySelectorAll('script, style')
          scripts.forEach((s) => s.remove())
          return document.body.innerText.substring(0, 5000) // First 5000 chars
        })

        const title = await page.title()

        findings.push({
          url,
          title,
          content: pageText,
        })
      } catch (error: any) {
        console.error(`[Executor] Error visiting ${url}:`, error.message)
        findings.push({
          url,
          error: error.message,
        })
      }
    }

    // Close browser
    await browser.close()

    // Ask Claude to analyze the collected data
    console.log(`[Executor] Analyzing ${findings.length} pages with Claude`)
    const analysisResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${task.instructions}

I visited these pages and collected data:

${JSON.stringify(findings, null, 2)}

Analyze this data and provide research results in JSON format:
{
  "findings": [
    {"title": "...", "details": "...", "url": "..."}
  ],
  "summary": "Brief summary of findings"
}`,
        },
      ],
    })

    // Extract final results
    const resultContent = analysisResponse.content.find((c: any) => c.type === 'text')
    if (!resultContent || resultContent.type !== 'text') {
      throw new Error('No analysis from Claude')
    }

    const resultMatch = resultContent.text.match(/\{[\s\S]*\}/)
    if (resultMatch) {
      return JSON.parse(resultMatch[0])
    }

    return {
      findings: [],
      summary: resultContent.text.trim(),
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
