import { NextRequest, NextResponse } from 'next/server'
import { pollCompletedTasks, pollFailedTasks } from '@/lib/browserbase/poller'

/**
 * Debug endpoint to manually trigger task polling
 * Use this for testing - not protected by auth
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Poll Now] Manually triggered task poll...')

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

    console.log('[Debug Poll Now] Completed:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Debug Poll Now] Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
