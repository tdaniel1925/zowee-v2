import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Check if user is admin (you can add an is_admin column or check email domain)
  // For now, allow all authenticated users to access admin
  // TODO: Add proper admin authorization

  // Get total signups
  const { count: totalSignups } = await supabase
    .from('jordyn_users')
    .select('*', { count: 'exact', head: true })

  // Get active subscribers (status = 'active')
  const { count: activeUsers } = await supabase
    .from('jordyn_users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Get trial users (status = 'trial' or status = 'trialing')
  const { count: trialUsers } = await supabase
    .from('jordyn_users')
    .select('*', { count: 'exact', head: true })
    .in('status', ['trial', 'trialing'])

  // Get all active users with plan info for revenue calculation
  const { data: activeUsersData } = await supabase
    .from('jordyn_users')
    .select('plan, status')
    .eq('status', 'active')

  // Calculate monthly revenue
  const monthlyRevenue =
    activeUsersData?.reduce((total, user) => {
      const planPrice = user.plan === 'family' ? 24 : 15
      return total + planPrice
    }, 0) || 0

  // Calculate churn rate (users who canceled in last 30 days / total active at start of month)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: canceledLast30Days } = await supabase
    .from('jordyn_users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('updated_at', thirtyDaysAgo.toISOString())

  const totalActiveStart = (activeUsers || 0) + (canceledLast30Days || 0)
  const churnRate =
    totalActiveStart > 0
      ? Number(((canceledLast30Days || 0) / totalActiveStart) * 100).toFixed(1)
      : '0.0'

  // Calculate average lifetime value
  // For now, use simple calculation: avg subscription length * plan price
  // TODO: Calculate from actual subscription data when available
  const avgLifetimeValue = 180 // Placeholder: 12 months * $15

  const stats = {
    totalSignups: totalSignups || 0,
    activeUsers: activeUsers || 0,
    trialUsers: trialUsers || 0,
    monthlyRevenue,
    churnRate: parseFloat(churnRate),
    avgLifetimeValue,
  }

  return <AdminDashboardClient stats={stats} />
}
