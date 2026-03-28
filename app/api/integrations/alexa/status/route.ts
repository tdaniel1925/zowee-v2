import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Check if user has Alexa linked
 */
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Zowee user
  const { data: zoweeUser } = await supabase
    .from('zowee_users')
    .select('preferences')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!zoweeUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const linked = !!(zoweeUser.preferences?.alexa_token)

  return NextResponse.json({ linked })
}
