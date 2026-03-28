import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Unlink Alexa account
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get Pokkit user
  const { data: pokkitUser } = await supabase
    .from('pokkit_users')
    .select('id, preferences')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!pokkitUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    // Remove Alexa tokens from preferences
    const preferences = pokkitUser.preferences || {}
    delete preferences.alexa_token
    delete preferences.alexa_refresh_token
    delete preferences.alexa_token_expires_at

    await supabase
      .from('pokkit_users')
      .update({ preferences })
      .eq('id', pokkitUser.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unlinking Alexa:', error)
    return NextResponse.json({ error: 'Failed to unlink Alexa' }, { status: 500 })
  }
}
