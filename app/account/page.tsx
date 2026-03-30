import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountDashboardClient from './AccountDashboardClient'

export default async function AccountDashboard() {
  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Get Jordyn user
  const { data: JordynUser, error: jordynUserError } = await supabase
    .from('jordyn_users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!JordynUser) {
    console.error('[Account Page] Jordyn user not found for auth user:', authUser.id)
    console.error('[Account Page] Error:', jordynUserError)

    // Return error page instead of redirect loop
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#E8E8F0' }}>
            Account Setup Incomplete
          </h1>
          <p className="mb-6" style={{ color: 'rgba(232,232,240,0.6)' }}>
            Your account authentication is working, but your Jordyn profile wasn't created properly.
            This usually happens if signup was interrupted.
          </p>
          <div className="space-y-3">
            <a
              href="/signup"
              className="block w-full py-3 rounded-lg font-semibold"
              style={{
                background: '#00E5B4',
                color: '#0A0A0F',
              }}
            >
              Complete Signup
            </a>
            <a
              href="mailto:support@jordyn.com"
              className="block w-full py-3 rounded-lg font-semibold"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#E8E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Get active monitors
  const { data: monitors } = await supabase
    .from('jordyn_monitors')
    .select('*')
    .eq('user_id', JordynUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get recent conversations (last 10)
  const { data: conversations } = await supabase
    .from('jordyn_conversations')
    .select('*')
    .eq('user_id', JordynUser.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get reminders from memory
  const { data: reminders } = await supabase
    .from('jordyn_memory')
    .select('*')
    .eq('user_id', JordynUser.id)
    .eq('category', 'reminder')
    .eq('active', true)
    .order('created_at', { ascending: false })

  // Calculate stats
  const activeMonitorsCount = monitors?.length || 0
  const activeRemindersCount = reminders?.length || 0
  const tasksThisWeek =
    conversations?.filter((c) => {
      const createdAt = new Date(c.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return createdAt >= weekAgo
    }).length || 0

  return (
    <AccountDashboardClient
      user={JordynUser}
      monitors={monitors || []}
      conversations={conversations || []}
      reminders={reminders || []}
      stats={{
        activeMonitors: activeMonitorsCount,
        activeReminders: activeRemindersCount,
        tasksThisWeek,
      }}
    />
  )
}
