import { NextRequest, NextResponse } from 'next/server'
import { pollCompletedTasks, pollFailedTasks } from '@/lib/browserbase/poller'

/**
 * Cron endpoint for polling browser task results
 * Runs every 1 minute via Vercel Cron
 *
 * To set up:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [
 *        {
 *          "path": "/api/cron/poll-tasks",
 *          "schedule": "* /1 * * * *"
 *        }
 *      ]
 *    }
 * 2. Set CRON_SECRET env variable in Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel automatically sets Authorization header for cron jobs)
    // Skip auth check in development if CRON_SECRET not set
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('authorization')
      const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

      if (authHeader !== expectedAuth) {
        console.error('[Cron Poll Tasks] Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('[Cron Poll Tasks] CRON_SECRET not set - auth check skipped')
    }

    console.log('[Cron Poll Tasks] Starting task poll...')

    // Poll completed tasks (priority)
    const completedResults = await pollCompletedTasks()

    // Poll failed tasks (lower priority)
    const failedResults = await pollFailedTasks()

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      completed: {
        notified: completedResults.notified,
        errors: completedResults.errors,
      },
      failed: {
        notified: failedResults.notified,
        errors: failedResults.errors,
      },
    }

    console.log('[Cron Poll Tasks] Completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Cron Poll Tasks] Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
