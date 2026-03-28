import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!pokkitUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 })
  }

  // Update monitor status to inactive
  const { error } = await supabase
    .from('pokkit_monitors')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', pokkitUser.id) // Security: only allow canceling own monitors

  if (error) {
    console.error('Error canceling monitor:', error)
    return NextResponse.json({ error: 'Failed to cancel monitor' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
