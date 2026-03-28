'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Monitor {
  id: string
  type: string
  target_product?: string
  target_url?: string
  threshold?: number
  threshold_direction?: string
  check_frequency?: string
  last_checked_at?: string
  metadata?: any
}

interface Conversation {
  id: string
  message_in: string
  message_out: string
  intent: string
  skill_used: string
  created_at: string
}

interface Reminder {
  id: string
  key: string
  value: string
  metadata?: any
  created_at: string
}

interface DashboardProps {
  user: any
  monitors: Monitor[]
  conversations: Conversation[]
  reminders: Reminder[]
  stats: {
    activeMonitors: number
    activeReminders: number
    tasksThisWeek: number
  }
}

export default function AccountDashboardClient({
  user,
  monitors,
  conversations,
  reminders,
  stats,
}: DashboardProps) {
  const [copied, setCopied] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<{
    type: string
    name: string
    id: string
  } | null>(null)

  const zoweeNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1 (555) 209-4471'
  const userName = user.name?.split(' ')[0] || 'there'

  const copyNumber = () => {
    navigator.clipboard.writeText(zoweeNumber.replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openInMessages = () => {
    window.location.href = `sms:${zoweeNumber}`
  }

  const openCancelModal = (type: string, name: string, id: string) => {
    setCancelTarget({ type, name, id })
    setShowCancelModal(true)
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancelTarget(null)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return

    try {
      const endpoint =
        cancelTarget.type === 'monitor'
          ? '/api/monitors/cancel'
          : '/api/reminders/cancel'

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cancelTarget.id }),
      })

      // Refresh page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error cancelling:', error)
      alert('Failed to cancel. Please try again.')
    }

    closeCancelModal()
  }

  // Format time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hr ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  // Format monitor display
  const formatMonitor = (monitor: Monitor) => {
    const metadata = monitor.metadata || {}
    const product = monitor.target_product || metadata.product || 'Unknown'
    const threshold = monitor.threshold
      ? `$${monitor.threshold}`
      : metadata.threshold || 'N/A'

    let emoji = '📊'
    let color = 'blue'
    let label = 'Monitor'

    if (monitor.type === 'price') {
      emoji = '🛍️'
      color = 'orange'
      label = 'Product'
    } else if (monitor.type === 'flight') {
      emoji = '✈️'
      color = 'blue'
      label = 'Flight'
    } else if (monitor.type === 'hotel') {
      emoji = '🏨'
      color = 'purple'
      label = 'Hotel'
    }

    return { emoji, color, label, product, threshold }
  }

  // Format reminder display
  const formatReminder = (reminder: Reminder) => {
    const value = JSON.parse(reminder.value || '{}')
    const text = value.text || reminder.key
    const time = value.time || 'No time set'

    let emoji = '⏰'
    let color = 'green'

    if (text.toLowerCase().includes('call')) {
      emoji = '📞'
      color = 'orange'
    } else if (text.toLowerCase().includes('gym') || text.toLowerCase().includes('workout')) {
      emoji = '🏋️'
      color = 'purple'
    } else if (text.toLowerCase().includes('vitamin') || text.toLowerCase().includes('medicine')) {
      emoji = '💊'
      color = 'green'
    } else if (text.toLowerCase().includes('gift') || text.toLowerCase().includes('order')) {
      emoji = '🎁'
      color = 'blue'
    }

    return { emoji, color, text, time }
  }

  // Format conversation display
  const formatConversation = (conv: Conversation) => {
    let emoji = '💬'
    let color = 'gray'
    let label = 'Chat'

    if (conv.intent?.includes('FLIGHT') || conv.skill_used === 'flight') {
      emoji = '✈️'
      color = 'blue'
      label = 'Flight'
    } else if (conv.intent?.includes('HOTEL') || conv.skill_used === 'hotel') {
      emoji = '🏨'
      color = 'purple'
      label = 'Hotel'
    } else if (conv.intent?.includes('PRICE') || conv.skill_used === 'price_tracking') {
      emoji = '🛍️'
      color = 'orange'
      label = 'Product'
    } else if (conv.intent?.includes('RESTAURANT') || conv.skill_used === 'restaurant') {
      emoji = '🍽️'
      color = 'pink'
      label = 'Restaurant'
    } else if (conv.intent?.includes('REMINDER')) {
      emoji = '⏰'
      color = 'green'
      label = 'Reminder'
    } else if (conv.intent?.includes('INFO') || conv.skill_used === 'general') {
      emoji = '🔍'
      color = 'yellow'
      label = 'Research'
    }

    return { emoji, color, label }
  }

  // Group conversations by date
  const groupConversationsByDate = () => {
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const older: Conversation[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    conversations.forEach((conv) => {
      const convDate = new Date(conv.created_at)
      if (convDate >= todayStart) {
        today.push(conv)
      } else if (convDate >= yesterdayStart) {
        yesterday.push(conv)
      } else {
        older.push(conv)
      }
    })

    return { today, yesterday, older }
  }

  const { today: todayConvos, yesterday: yesterdayConvos } = groupConversationsByDate()

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
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-zowee-green">
              <span className="font-heading font-extrabold text-zowee-dark text-[11px] tracking-tight">
                Z
              </span>
            </div>
            <Link
              href="/account"
              className="font-heading font-bold text-xl text-zowee-light tracking-tight no-underline"
            >
              ZOWEE
            </Link>
            <div
              className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(0,232,122,0.08)',
                border: '1px solid rgba(0,232,122,0.15)',
              }}
            >
              <span className="text-[10px]">⚡</span>
              <span className="font-heading font-bold text-[11px] text-zowee-green tracking-wide">
                {user.plan === 'family' ? 'Family $24' : 'Solo $15'}
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/account"
              className="text-sm font-medium text-zowee-green transition-colors no-underline"
            >
              Dashboard
            </Link>
            <Link
              href="/account/monitors"
              className="text-sm font-medium text-zowee-light/60 hover:text-zowee-light transition-colors no-underline"
            >
              Monitors
            </Link>
            <Link
              href="/account/settings"
              className="text-sm font-medium text-zowee-light/60 hover:text-zowee-light transition-colors no-underline"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-zowee-green rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-zowee-light/45">Live</span>
            </div>
            <Link
              href="/account/settings"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 hover:bg-white/10 transition-colors no-underline"
            >
              Manage Billing
            </Link>
          </div>
        </div>
      </header>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeCancelModal}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{
              background: 'linear-gradient(145deg, #111118, #0E0E16)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/25">
                <span className="text-base">⚠️</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-zowee-light tracking-tight">
                  Cancel {cancelTarget?.type}?
                </h3>
                <p className="text-xs mt-0.5 text-zowee-light/45">
                  This will stop tracking immediately.
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-zowee-light/55">
              You'll stop receiving alerts for {cancelTarget?.name}. You can always set up a new{' '}
              {cancelTarget?.type} by texting Zowee.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/6 border border-white/10 text-zowee-light/70 hover:bg-white/10 transition-all"
              >
                Keep It
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/20 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 opacity-15"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,232,122,0.4) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-zowee-dark pt-[60px]">
        <div className="max-w-5xl mx-auto px-4 relative z-10 pb-24">
          {/* Page Header */}
          <section className="pt-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
              <div>
                <h1 className="font-heading font-bold text-[1.75rem] tracking-tight text-zowee-light leading-tight">
                  Good morning, {userName} 👋
                </h1>
                <p className="text-sm mt-1 text-zowee-light/45">
                  Here's what Zowee is watching for you right now.
                </p>
              </div>
              <div className="flex items-center gap-2.5 sm:hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zowee-green/8 border border-zowee-green/15">
                  <span className="text-[10px]">⚡</span>
                  <span className="font-heading font-bold text-[11px] text-zowee-green">
                    {user.plan === 'family' ? 'Family $24' : 'Solo $15'}
                  </span>
                </div>
                <Link
                  href="/account/settings"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 no-underline"
                >
                  Manage Billing
                </Link>
              </div>
            </div>

            {/* Stats Row */}
            <div
              className="grid grid-cols-3 gap-3 mt-5 animate-fade-in-up"
              style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-green tracking-tight">
                  {stats.activeMonitors}
                </p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Active Monitors</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-light tracking-tight">
                  {stats.activeReminders}
                </p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Reminders Set</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-light tracking-tight">
                  {stats.tasksThisWeek}
                </p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Tasks This Week</p>
              </div>
            </div>
          </section>

          {/* Zowee Number Card */}
          <section
            className="pb-7 animate-fade-in-up"
            style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <p className="text-xs font-semibold mb-3 text-zowee-light/45 tracking-wider uppercase">
              Your Zowee Number
            </p>
            <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-zowee-green/12 border border-zowee-green/25">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <p className="text-xs mb-1 text-zowee-light/45">
                      Text this number to talk to Zowee
                    </p>
                    <p className="font-heading font-bold text-2xl tracking-[1.5px] text-zowee-green leading-tight">
                      {zoweeNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-zowee-green/70">
                        Online · Responds in &lt;60s
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={copyNumber}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 hover:bg-white/10 transition-all"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={openInMessages}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zowee-green/10 border border-zowee-green/20 text-zowee-green hover:bg-zowee-green/15 transition-all"
                  >
                    <span>💬</span>
                    <span>Open in Messages</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Monitors */}
          {monitors.length > 0 && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">
                  Active Monitors
                </p>
                <Link
                  href="/account/monitors"
                  className="text-xs font-semibold text-zowee-green/70 hover:text-zowee-green transition-colors no-underline"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-3">
                {monitors.slice(0, 5).map((monitor) => {
                  const { emoji, color, label, product, threshold } = formatMonitor(monitor)
                  return (
                    <div
                      key={monitor.id}
                      className="rounded-2xl px-4 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-${color}-500/10 border border-${color}-500/20`}
                        >
                          <span className="text-[17px]">{emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}
                            >
                              {label}
                            </span>
                            <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                            <span className="text-xs text-zowee-light/35">
                              Checking {monitor.check_frequency || 'regularly'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-zowee-light">{product}</p>
                          <p className="text-xs mt-0.5 text-zowee-light/45">
                            Alert when {monitor.threshold_direction || 'below'}{' '}
                            <span className="text-zowee-green font-semibold">{threshold}</span>
                          </p>
                          {monitor.last_checked_at && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-zowee-light/30">
                                Last checked {timeAgo(monitor.last_checked_at)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => openCancelModal('monitor', product, monitor.id)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Upcoming Reminders */}
          {reminders.length > 0 && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">
                  Upcoming Reminders
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zowee-green/10 border border-zowee-green/20 text-zowee-green/80">
                  {reminders.length} active
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden bg-white/2 border border-white/5">
                {reminders.slice(0, 5).map((reminder, index) => {
                  const { emoji, color, text, time } = formatReminder(reminder)
                  return (
                    <div
                      key={reminder.id}
                      className={`px-4 py-3.5 flex items-center gap-3 ${
                        index < reminders.length - 1 ? 'border-b border-white/5' : ''
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-${color}-500/8 border border-${color}-500/18`}
                      >
                        <span className="text-sm">{emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zowee-light">{text}</p>
                        <p className="text-xs mt-0.5 text-zowee-light/40">{time}</p>
                      </div>
                      <button
                        onClick={() => openCancelModal('reminder', text, reminder.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Recent Activity */}
          {conversations.length > 0 && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">
                  Recent Activity
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden bg-white/2 border border-white/5">
                {/* Today Group */}
                {todayConvos.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-white/2 border-b border-white/5">
                      <p className="text-xs font-semibold text-zowee-light/35 tracking-wide uppercase">
                        Today
                      </p>
                    </div>
                    {todayConvos.map((conv, index) => {
                      const { emoji, color, label } = formatConversation(conv)
                      return (
                        <div
                          key={conv.id}
                          className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-${color}-500/8 border border-${color}-500/15`}
                          >
                            <span className="text-[13px]">{emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span
                                className={`text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-${color}-500/10 text-${color}-400`}
                              >
                                {label}
                              </span>
                              <span className="text-xs text-zowee-light/30">
                                {new Date(conv.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-zowee-light/80">"{conv.message_in}"</p>
                            <p className="text-xs mt-1 text-zowee-light/40">
                              {conv.message_out.substring(0, 80)}
                              {conv.message_out.length > 80 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Yesterday Group */}
                {yesterdayConvos.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-white/2 border-y border-white/5">
                      <p className="text-xs font-semibold text-zowee-light/35 tracking-wide uppercase">
                        Yesterday
                      </p>
                    </div>
                    {yesterdayConvos.map((conv, index) => {
                      const { emoji, color, label } = formatConversation(conv)
                      const isLast = index === yesterdayConvos.length - 1
                      return (
                        <div
                          key={conv.id}
                          className={`px-4 py-3.5 flex items-start gap-3 ${
                            !isLast ? 'border-b border-white/5' : ''
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-${color}-500/8 border border-${color}-500/15`}
                          >
                            <span className="text-[13px]">{emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span
                                className={`text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-${color}-500/10 text-${color}-400`}
                              >
                                {label}
                              </span>
                              <span className="text-xs text-zowee-light/30">
                                {new Date(conv.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-zowee-light/80">"{conv.message_in}"</p>
                            <p className="text-xs mt-1 text-zowee-light/40">
                              {conv.message_out.substring(0, 80)}
                              {conv.message_out.length > 80 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </section>
          )}

          {/* Empty State */}
          {monitors.length === 0 && conversations.length === 0 && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="rounded-2xl px-8 py-12 text-center bg-white/2 border border-white/5">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-zowee-green/10 border border-zowee-green/20">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-zowee-light mb-2">
                  Welcome to Zowee!
                </h3>
                <p className="text-sm text-zowee-light/50 mb-6 max-w-md mx-auto">
                  Get started by sending a text to {zoweeNumber}. Try asking me to track a price,
                  find a flight, or set a reminder.
                </p>
                <button
                  onClick={openInMessages}
                  className="px-6 py-3 rounded-lg text-sm font-bold bg-zowee-green/15 border border-zowee-green/30 text-zowee-green hover:bg-zowee-green/20 transition-all"
                >
                  Send Your First Message
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
