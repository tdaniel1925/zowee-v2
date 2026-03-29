/**
 * Sales Agent API
 * Returns the Telnyx assistant ID for the sales widget
 */

import { NextResponse } from 'next/server'
import { getSalesAgent } from '@/lib/telnyx/sales-agent'

export async function GET() {
  try {
    const agent = await getSalesAgent()

    if (!agent.assistantId) {
      return NextResponse.json(
        { error: 'Failed to get sales agent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      assistantId: agent.assistantId,
    })
  } catch (error) {
    console.error('[API] Sales agent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
