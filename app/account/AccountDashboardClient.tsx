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

  // Get user's personal Jordyn number (provisioned during signup)
  const rawNumber = user.twilio_phone_number
  let JordynNumber = 'Provisioning...'

  if (rawNumber) {
    // Format as +1 (XXX) XXX-XXXX
    const cleaned = rawNumber.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      JordynNumber = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      JordynNumber = `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else {
      JordynNumber = rawNumber
    }
  }

  const userName = user.name?.split(' ')[0] || 'there'

  const copyNumber = () => {
    navigator.clipboard.writeText(JordynNumber.replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openInMessages = () => {
    window.location.href = `sms:${JordynNumber}`
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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-Jordyn-green">
              <span className="font-heading font-extrabold text-Jordyn-dark text-[11px] tracking-tight">
                Z
              </span>
            </div>
            <Link
              href="/account"
              className="font-heading font-bold text-xl text-Jordyn-light tracking-tight no-underline"
            >
              Jordyn
            </Link>
            <div
              className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg"
              style={{
                background: 'rgba(0,232,122,0.08)',
                border: '1px solid rgba(0,232,122,0.15)',
              }}
            >
              <span className="text-[10px]">⚡</span>
              <span className="font-heading font-bold text-[11px] text-Jordyn-green tracking-wide">
                {user.plan === 'solo' && 'Solo $19'}
                {user.plan === 'family' && 'Family $34'}
                {user.plan === 'solo_voice' && 'Solo+Voice $39'}
                {user.plan === 'family_voice' && 'Family+Voice $59'}
                {user.plan === 'business' && 'Business $97'}
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/account"
              className="text-sm font-medium text-Jordyn-green transition-colors no-underline"
            >
              Dashboard
            </Link>
            <Link
              href="/account/monitors"
              className="text-sm font-medium text-Jordyn-light/60 hover:text-Jordyn-light transition-colors no-underline"
            >
              Monitors
            </Link>
            <Link
              href="/account/settings"
              className="text-sm font-medium text-Jordyn-light/60 hover:text-Jordyn-light transition-colors no-underline"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-Jordyn-green rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-Jordyn-light/45">Live</span>
            </div>
            <Link
              href="/account/settings"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-Jordyn-light/80 hover:bg-white/10 transition-colors no-underline"
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
                <h3 className="font-heading font-bold text-base text-Jordyn-light tracking-tight">
                  Cancel {cancelTarget?.type}?
                </h3>
                <p className="text-xs mt-0.5 text-Jordyn-light/45">
                  This will stop tracking immediately.
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-Jordyn-light/55">
              You'll stop receiving alerts for {cancelTarget?.name}. You can always set up a new{' '}
              {cancelTarget?.type} by texting Jordyn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/6 border border-white/10 text-Jordyn-light/70 hover:bg-white/10 transition-all"
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
      <div className="min-h-screen bg-Jordyn-dark pt-[60px]">
        <div className="max-w-5xl mx-auto px-4 relative z-10 pb-24">
          {/* Page Header */}
          <section className="pt-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up">
              <div>
                <h1 className="font-heading font-bold text-[1.75rem] tracking-tight text-Jordyn-light leading-tight">
                  Good morning, {userName} 👋
                </h1>
                <p className="text-sm mt-1 text-Jordyn-light/45">
                  Here's what Jordyn is watching for you right now.
                </p>
              </div>
              <div className="flex items-center gap-2.5 sm:hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-Jordyn-green/8 border border-Jordyn-green/15">
                  <span className="text-[10px]">⚡</span>
                  <span className="font-heading font-bold text-[11px] text-Jordyn-green">
                    {user.plan === 'solo' && 'Solo $19'}
                    {user.plan === 'family' && 'Family $34'}
                    {user.plan === 'solo_voice' && 'Solo+Voice $39'}
                    {user.plan === 'family_voice' && 'Family+Voice $59'}
                    {user.plan === 'business' && 'Business $97'}
                  </span>
                </div>
                <Link
                  href="/account/settings"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-Jordyn-light/80 no-underline"
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
                <p className="font-heading font-bold text-xl text-Jordyn-green tracking-tight">
                  {stats.activeMonitors}
                </p>
                <p className="text-xs mt-0.5 text-Jordyn-light/40">Active Monitors</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-Jordyn-light tracking-tight">
                  {stats.activeReminders}
                </p>
                <p className="text-xs mt-0.5 text-Jordyn-light/40">Reminders Set</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-Jordyn-light tracking-tight">
                  {stats.tasksThisWeek}
                </p>
                <p className="text-xs mt-0.5 text-Jordyn-light/40">Tasks This Week</p>
              </div>
            </div>
          </section>

          {/* Jordyn Number Card */}
          <section
            className="pb-7 animate-fade-in-up"
            style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <p className="text-xs font-semibold mb-3 text-Jordyn-light/45 tracking-wider uppercase">
              Your Jordyn Number
            </p>
            <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-Jordyn-green/12 border border-Jordyn-green/25">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <p className="text-xs mb-1 text-Jordyn-light/45">
                      Text this number to talk to Jordyn
                    </p>
                    <p className="font-heading font-bold text-2xl tracking-[1.5px] text-Jordyn-green leading-tight">
                      {JordynNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-Jordyn-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-Jordyn-green/70">
                        Online · Responds in &lt;60s
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    onClick={copyNumber}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-Jordyn-light/80 hover:bg-white/10 transition-all"
                  >
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={openInMessages}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-Jordyn-green/10 border border-Jordyn-green/20 text-Jordyn-green hover:bg-Jordyn-green/15 transition-all"
                  >
                    <span>💬</span>
                    <span>Open in Messages</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Voice Usage Section (for voice-enabled plans) */}
          {user.voice_enabled && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <p className="text-xs font-semibold mb-3 text-Jordyn-light/45 tracking-wider uppercase">
                Voice Minutes
              </p>
              <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/15">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-500/12 border border-purple-500/25">
                    <span className="text-xl">🎙️</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-heading font-bold text-base text-Jordyn-light">
                        AI Voice Calls
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-Jordyn-light/45">
                      Call {JordynNumber} anytime to talk with your AI assistant
                    </p>
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-Jordyn-light/60">Used this month</span>
                    <span className="font-heading font-bold text-sm text-Jordyn-light">
                      {user.voice_minutes_used || 0} / {user.voice_minutes_quota || 0} minutes
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/8">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((user.voice_minutes_used || 0) / (user.voice_minutes_quota || 1)) * 100,
                          100
                        )}%`,
                        background:
                          (user.voice_minutes_used || 0) > (user.voice_minutes_quota || 0)
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : 'linear-gradient(90deg, #a855f7, #8b5cf6)',
                      }}
                    />
                  </div>
                </div>

                {/* Reset Date and Status */}
                <div className="flex items-center justify-between pt-3 border-t border-white/8">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-Jordyn-light/40">Resets on</span>
                    <span className="text-xs font-semibold text-Jordyn-light/70">
                      {user.voice_minutes_reset_at
                        ? new Date(user.voice_minutes_reset_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                  {(user.voice_minutes_used || 0) > (user.voice_minutes_quota || 0) && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                      ${((user.voice_minutes_used - user.voice_minutes_quota) * 0.5).toFixed(2)}{' '}
                      overage
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Upgrade to Voice CTA (for non-voice plans) */}
          {!user.voice_enabled && (
            <section
              className="pb-7 animate-fade-in-up"
              style={{ animationDelay: '0.15s', opacity: 0, animationFillMode: 'forwards' }}
            >
              <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/15">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-500/12 border border-purple-500/25">
                    <span className="text-xl">🎙️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-base text-Jordyn-light mb-1">
                      Unlock Voice Calling
                    </h3>
                    <p className="text-sm text-Jordyn-light/55 mb-3">
                      Upgrade to talk with Jordyn instead of texting. Perfect for hands-free help
                      while driving, cooking, or on the go.
                    </p>
                    <Link
                      href="/account/settings"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all no-underline"
                    >
                      <span>View Plans</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Smart Home Integration CTA */}
          <section
            className="pb-7 animate-fade-in-up"
            style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border border-blue-500/15">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-500/12 border border-blue-500/25">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#00CAFF"/>
                    <path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill="white"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-base text-Jordyn-light mb-1">
                    Control Your Smart Home
                  </h3>
                  <p className="text-sm text-Jordyn-light/55 mb-3">
                    Link your Alexa account to control lights, thermostat, locks, and more via text. Turn off bedroom lights, adjust temperature, all from SMS.
                  </p>
                  <Link
                    href="/account/integrations"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-all no-underline"
                  >
                    <span>Link Alexa</span>
                    <span>→</span>
                  </Link>
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
                <p className="text-xs font-semibold text-Jordyn-light/45 tracking-wider uppercase">
                  Active Monitors
                </p>
                <Link
                  href="/account/monitors"
                  className="text-xs font-semibold text-Jordyn-green/70 hover:text-Jordyn-green transition-colors no-underline"
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
                            <div className="w-1.5 h-1.5 bg-Jordyn-green rounded-full animate-pulse"></div>
                            <span className="text-xs text-Jordyn-light/35">
                              Checking {monitor.check_frequency || 'regularly'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-Jordyn-light">{product}</p>
                          <p className="text-xs mt-0.5 text-Jordyn-light/45">
                            Alert when {monitor.threshold_direction || 'below'}{' '}
                            <span className="text-Jordyn-green font-semibold">{threshold}</span>
                          </p>
                          {monitor.last_checked_at && (
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-Jordyn-light/30">
                                Last checked {timeAgo(monitor.last_checked_at)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => openCancelModal('monitor', product, monitor.id)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-Jordyn-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
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
                <p className="text-xs font-semibold text-Jordyn-light/45 tracking-wider uppercase">
                  Upcoming Reminders
                </p>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-Jordyn-green/10 border border-Jordyn-green/20 text-Jordyn-green/80">
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
                        <p className="text-sm font-semibold text-Jordyn-light">{text}</p>
                        <p className="text-xs mt-0.5 text-Jordyn-light/40">{time}</p>
                      </div>
                      <button
                        onClick={() => openCancelModal('reminder', text, reminder.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-Jordyn-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
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
                <p className="text-xs font-semibold text-Jordyn-light/45 tracking-wider uppercase">
                  Recent Activity
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden bg-white/2 border border-white/5">
                {/* Today Group */}
                {todayConvos.length > 0 && (
                  <>
                    <div className="px-4 py-2.5 bg-white/2 border-b border-white/5">
                      <p className="text-xs font-semibold text-Jordyn-light/35 tracking-wide uppercase">
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
                              <span className="text-xs text-Jordyn-light/30">
                                {new Date(conv.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-Jordyn-light/80">"{conv.message_in}"</p>
                            <p className="text-xs mt-1 text-Jordyn-light/40">
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
                      <p className="text-xs font-semibold text-Jordyn-light/35 tracking-wide uppercase">
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
                              <span className="text-xs text-Jordyn-light/30">
                                {new Date(conv.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-Jordyn-light/80">"{conv.message_in}"</p>
                            <p className="text-xs mt-1 text-Jordyn-light/40">
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-Jordyn-green/10 border border-Jordyn-green/20">
                  <span className="text-3xl">👋</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-Jordyn-light mb-2">
                  Welcome to Jordyn!
                </h3>
                <p className="text-sm text-Jordyn-light/50 mb-6 max-w-md mx-auto">
                  Get started by sending a text to {JordynNumber}. Try asking me to track a price,
                  find a flight, or set a reminder.
                </p>
                <button
                  onClick={openInMessages}
                  className="px-6 py-3 rounded-lg text-sm font-bold bg-Jordyn-green/15 border border-Jordyn-green/30 text-Jordyn-green hover:bg-Jordyn-green/20 transition-all"
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
