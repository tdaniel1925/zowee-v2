'use client'

import Link from 'next/link'

interface AdminStats {
  totalSignups: number
  activeUsers: number
  trialUsers: number
  monthlyRevenue: number
  churnRate: number
  avgLifetimeValue: number
}

interface AdminDashboardClientProps {
  stats: AdminStats
}

export default function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  return (
    <>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[60px]"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green">
              <span className="font-heading font-extrabold text-Jordyn-dark text-[11px] tracking-tight">
                Z
              </span>
            </div>
            <span className="font-heading font-bold text-xl text-Jordyn-light tracking-tight">
              Jordyn
            </span>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px]">🔐</span>
              <span className="font-heading font-bold text-[11px] text-amber-400 tracking-wide">
                Admin
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium text-Jordyn-green transition-colors no-underline"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/customers"
              className="text-sm font-medium text-Jordyn-light/60 hover:text-Jordyn-light transition-colors no-underline"
            >
              Customers
            </Link>
            <Link
              href="/admin/apex-logs"
              className="text-sm font-medium text-Jordyn-light/60 hover:text-Jordyn-light transition-colors no-underline"
            >
              Apex Logs
            </Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-Jordyn-green rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-Jordyn-light/45">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-96 h-96 opacity-10"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,232,122,0.35) 0%, transparent 65%)',
            filter: 'blur(90px)',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-Jordyn-dark pt-[60px]">
        <div className="max-w-6xl mx-auto px-4 relative z-10 pb-24">
          {/* Page Header */}
          <section className="pt-8 pb-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-heading font-bold text-2xl text-Jordyn-light tracking-tight">
                  Company Dashboard
                </h1>
                <p className="text-sm mt-1 text-Jordyn-light/45">
                  Sales and customer tracking for Jordyn
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-Jordyn-light/40">Last updated</p>
                <p className="text-sm font-semibold text-Jordyn-light">Just now</p>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <section
            className="pb-6 animate-fade-in-up"
            style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Signups */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green/15 border border-Jordyn-green/25">
                    <span className="text-lg">📊</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-Jordyn-light tracking-tight leading-none">
                  {stats.totalSignups}
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">Total Signups</p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">All-time</p>
              </div>

              {/* Active Users */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-Jordyn-green/5 to-Jordyn-green/2 border border-Jordyn-green/20">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green/15 border border-Jordyn-green/25">
                    <span className="text-lg">✅</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-Jordyn-green tracking-tight leading-none">
                  {stats.activeUsers}
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">
                  Active Subscribers
                </p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">Paying monthly</p>
              </div>

              {/* Trial Users */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-500/25">
                    <span className="text-lg">🧪</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-blue-400 tracking-tight leading-none">
                  {stats.trialUsers}
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">Trial Users</p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">In 14-day trial</p>
              </div>

              {/* Monthly Revenue */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-500/5 to-amber-500/2 border border-amber-500/20">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/15 border border-amber-500/25">
                    <span className="text-lg">💰</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-amber-400 tracking-tight leading-none">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">Monthly Revenue</p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">MRR at $15/user</p>
              </div>

              {/* Churn Rate */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-500/15 border border-purple-500/25">
                    <span className="text-lg">📉</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-purple-400 tracking-tight leading-none">
                  {stats.churnRate}%
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">Churn Rate</p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">Last 30 days</p>
              </div>

              {/* Avg LTV */}
              <div className="rounded-2xl p-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green/15 border border-Jordyn-green/25">
                    <span className="text-lg">📈</span>
                  </div>
                </div>
                <p className="font-heading font-bold text-3xl text-Jordyn-green tracking-tight leading-none">
                  ${stats.avgLifetimeValue}
                </p>
                <p className="text-xs font-semibold mt-1.5 text-Jordyn-light/65">
                  Avg Lifetime Value
                </p>
                <p className="text-xs mt-0.5 text-Jordyn-light/35">Per customer</p>
              </div>
            </div>
          </section>

          {/* Info Card */}
          <section
            className="pb-6 animate-fade-in-up"
            style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-500/5 to-blue-500/2 border border-blue-500/15">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-500/25">
                  <span className="text-base">ℹ️</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-Jordyn-light/85 mb-1">
                    All customer data sent to Apex
                  </p>
                  <p className="text-xs text-Jordyn-light/55 leading-relaxed">
                    Customer signups, trial conversions, cancellations, and plan changes are
                    automatically sent to the Apex Affinity system via webhook. Reps use the Apex
                    portal to track their commissions and subscribers. This dashboard is for
                    company admins to monitor overall sales and customer health.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section
            className="pb-6 animate-fade-in-up"
            style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <p className="text-xs font-semibold mb-3 text-Jordyn-light/45 tracking-wider uppercase">
              Quick Actions
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/customers"
                className="rounded-2xl px-5 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-3 no-underline"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green/8 border border-Jordyn-green/18">
                  <span className="text-base">👥</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-Jordyn-light/85">View All Customers</p>
                  <p className="text-xs text-Jordyn-light/40">Browse {stats.totalSignups} signups</p>
                </div>
                <span className="text-Jordyn-light/25 text-sm">›</span>
              </Link>
              <Link
                href="/admin/apex-logs"
                className="rounded-2xl px-5 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors flex items-center gap-3 no-underline"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/8 border border-blue-500/18">
                  <span className="text-base">🔗</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-Jordyn-light/85">Apex Webhook Logs</p>
                  <p className="text-xs text-Jordyn-light/40">View data sent to Apex</p>
                </div>
                <span className="text-Jordyn-light/25 text-sm">›</span>
              </Link>
            </div>
          </section>

          {/* Recent Activity Placeholder */}
          <section
            className="pb-8 animate-fade-in-up"
            style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <p className="text-xs font-semibold mb-3 text-Jordyn-light/45 tracking-wider uppercase">
              Recent Activity
            </p>
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
              <div className="px-5 py-4 text-center">
                <p className="text-sm text-Jordyn-light/40">
                  {stats.totalSignups === 0
                    ? 'No signups yet'
                    : 'Recent signups, conversions, and cancellations will appear here'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
