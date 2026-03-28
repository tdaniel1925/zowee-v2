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

  // Get Zowee user
  const { data: zoweeUser } = await supabase
    .from('zowee_users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!zoweeUser) {
    redirect('/login')
  }

  // Get active monitors
  const { data: monitors } = await supabase
    .from('zowee_monitors')
    .select('*')
    .eq('user_id', zoweeUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Get recent conversations (last 10)
  const { data: conversations } = await supabase
    .from('zowee_conversations')
    .select('*')
    .eq('user_id', zoweeUser.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get reminders from memory
  const { data: reminders } = await supabase
    .from('zowee_memory')
    .select('*')
    .eq('user_id', zoweeUser.id)
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
      user={zoweeUser}
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
