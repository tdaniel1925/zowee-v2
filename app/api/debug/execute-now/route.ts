import { NextRequest, NextResponse } from 'next/server'
import { executePendingTasks } from '@/lib/browserbase/executor'

/**
 * Debug endpoint to manually trigger task execution
 * Use this for testing - not protected by auth
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Execute Now] Manually triggered task execution...')

    const result = await executePendingTasks()

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
    }

    console.log('[Debug Execute Now] Completed:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Debug Execute Now] Fatal error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
