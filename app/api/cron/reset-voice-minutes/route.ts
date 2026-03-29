/**
 * Voice Minutes Reset Cron Job
 * Runs daily to reset voice minutes for users whose billing period has ended
 * Configured in vercel.json to run at midnight UTC
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getVoiceQuota } from '@/lib/vapi/provisioning'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON] Unauthorized request to reset-voice-minutes')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting voice minutes reset')

    const admin = supabaseAdmin()

    // Find all users whose reset date has passed
    const { data: users, error: fetchError } = await admin
      .from('jordyn_users')
      .select('id, plan, voice_minutes_reset_at')
      .eq('voice_enabled', true)
      .lte('voice_minutes_reset_at', new Date().toISOString())

    if (fetchError) {
      console.error('[CRON] Failed to fetch users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      console.log('[CRON] No users need reset')
      return NextResponse.json({
        success: true,
        reset: 0,
        message: 'No users needed reset',
      })
    }

    console.log(`[CRON] Resetting ${users.length} users`)

    // Reset each user
    const resetPromises = users.map(async (user: any) => {
      const quota = getVoiceQuota(user.plan as any)
      const nextResetDate = new Date()
      nextResetDate.setMonth(nextResetDate.getMonth() + 1)

      return admin
        .from('jordyn_users')
        .update({
          voice_minutes_used: 0,
          voice_minutes_reset_at: nextResetDate.toISOString(),
        })
        .eq('id', user.id)
    })

    const results = await Promise.allSettled(resetPromises)

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.filter((r) => r.status === 'rejected').length

    console.log(`[CRON] Reset complete: ${successCount} succeeded, ${failCount} failed`)

    return NextResponse.json({
      success: true,
      reset: successCount,
      failed: failCount,
      total: users.length,
    })
  } catch (error) {
    console.error('[CRON] Reset voice minutes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
