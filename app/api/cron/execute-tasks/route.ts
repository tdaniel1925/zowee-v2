import { NextRequest, NextResponse } from 'next/server'
import { executePendingTasks } from '@/lib/browserbase/executor'

/**
 * Cron endpoint for executing pending browser tasks
 * Runs every 1 minute via Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (skip auth check if CRON_SECRET not set)
    if (process.env.CRON_SECRET) {
      const authHeader = request.headers.get('authorization')
      const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

      if (authHeader !== expectedAuth) {
        console.error('[Cron Execute Tasks] Unauthorized request')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('[Cron Execute Tasks] CRON_SECRET not set - auth check skipped')
    }

    console.log('[Cron Execute Tasks] Starting task execution...')

    const result = await executePendingTasks()

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    }

    console.log('[Cron Execute Tasks] Completed:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Cron Execute Tasks] Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
