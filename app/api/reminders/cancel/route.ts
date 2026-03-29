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
    .from('jordyn_users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!pokkitUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Reminder ID required' }, { status: 400 })
  }

  // Update reminder to inactive
  const { error } = await supabase
    .from('jordyn_memory')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', pokkitUser.id) // Security: only allow canceling own reminders

  if (error) {
    console.error('Error canceling reminder:', error)
    return NextResponse.json({ error: 'Failed to cancel reminder' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
