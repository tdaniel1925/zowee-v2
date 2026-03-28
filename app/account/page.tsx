'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AccountDashboard() {
  const [copied, setCopied] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<{type: string, name: string} | null>(null)

  const zoweeNumber = '+1 (555) 209-4471'
  const userName = 'Alex'

  const copyNumber = () => {
    navigator.clipboard.writeText(zoweeNumber.replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openInMessages = () => {
    window.location.href = `sms:${zoweeNumber}`
  }

  const openCancelModal = (type: string, name: string) => {
    setCancelTarget({ type, name })
    setShowCancelModal(true)
  }

  const closeCancelModal = () => {
    setShowCancelModal(false)
    setCancelTarget(null)
  }

  const confirmCancel = () => {
    // TODO: Implement actual cancellation
    console.log('Cancelling:', cancelTarget)
    closeCancelModal()
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[60px]" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-zowee-green">
              <span className="font-heading font-extrabold text-zowee-dark text-[11px] tracking-tight">Z</span>
            </div>
            <Link href="/account" className="font-heading font-bold text-xl text-zowee-light tracking-tight no-underline">ZOWEE</Link>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-lg" style={{ background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.15)' }}>
              <span className="text-[10px]">⚡</span>
              <span className="font-heading font-bold text-[11px] text-zowee-green tracking-wide">Solo $15</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/account" className="text-sm font-medium text-zowee-green transition-colors no-underline">Dashboard</Link>
            <Link href="/account/monitors" className="text-sm font-medium text-zowee-light/60 hover:text-zowee-light transition-colors no-underline">Monitors</Link>
            <Link href="/account/settings" className="text-sm font-medium text-zowee-light/60 hover:text-zowee-light transition-colors no-underline">Settings</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 bg-zowee-green rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-zowee-light/45">Live</span>
            </div>
            <Link href="/account/settings" className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 hover:bg-white/10 transition-colors no-underline">Manage Billing</Link>
          </div>
        </div>
      </header>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeCancelModal}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ background: 'linear-gradient(145deg, #111118, #0E0E16)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-500/10 border border-red-500/25">
                <span className="text-base">⚠️</span>
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-zowee-light tracking-tight">Cancel {cancelTarget?.type}?</h3>
                <p className="text-xs mt-0.5 text-zowee-light/45">This will stop tracking immediately.</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-zowee-light/55">
              You'll stop receiving alerts for {cancelTarget?.name}. You can always set up a new monitor by texting Zowee.
            </p>
            <div className="flex gap-3">
              <button onClick={closeCancelModal} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/6 border border-white/10 text-zowee-light/70 hover:bg-white/10 transition-all">
                Keep It
              </button>
              <button onClick={confirmCancel} className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/20 transition-all">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 opacity-15" style={{ background: 'radial-gradient(ellipse, rgba(0,232,122,0.4) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
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
                <p className="text-sm mt-1 text-zowee-light/45">Here's what Zowee is watching for you right now.</p>
              </div>
              <div className="flex items-center gap-2.5 sm:hidden">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zowee-green/8 border border-zowee-green/15">
                  <span className="text-[10px]">⚡</span>
                  <span className="font-heading font-bold text-[11px] text-zowee-green">Solo $15</span>
                </div>
                <Link href="/account/settings" className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 no-underline">Manage Billing</Link>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-5 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-green tracking-tight">3</p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Active Monitors</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-light tracking-tight">4</p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Reminders Set</p>
              </div>
              <div className="rounded-2xl px-4 py-3 text-center bg-white/2 border border-white/5">
                <p className="font-heading font-bold text-xl text-zowee-light tracking-tight">12</p>
                <p className="text-xs mt-0.5 text-zowee-light/40">Tasks This Week</p>
              </div>
            </div>
          </section>

          {/* Zowee Number Card */}
          <section className="pb-7 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-xs font-semibold mb-3 text-zowee-light/45 tracking-wider uppercase">Your Zowee Number</p>
            <div className="rounded-2xl px-5 py-5 bg-gradient-to-br from-white/3 to-white/1 border border-white/8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-zowee-green/12 border border-zowee-green/25">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <p className="text-xs mb-1 text-zowee-light/45">Text this number to talk to Zowee</p>
                    <p className="font-heading font-bold text-2xl tracking-[1.5px] text-zowee-green leading-tight">{zoweeNumber}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-zowee-green/70">Online · Responds in &lt;60s</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <button onClick={copyNumber} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/80 hover:bg-white/10 transition-all">
                    <span>{copied ? '✓' : '📋'}</span>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button onClick={openInMessages} className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zowee-green/10 border border-zowee-green/20 text-zowee-green hover:bg-zowee-green/15 transition-all">
                    <span>💬</span>
                    <span>Open in Messages</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Monitors */}
          <section className="pb-7 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">Active Monitors</p>
              <Link href="/account/monitors" className="text-xs font-semibold text-zowee-green/70 hover:text-zowee-green transition-colors no-underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {/* Flight Monitor */}
              <div className="rounded-2xl px-4 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[17px]">✈️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Flight</span>
                      <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-zowee-light/35">Checking every 15 min</span>
                    </div>
                    <p className="text-sm font-semibold text-zowee-light">NYC → LAX · Round Trip</p>
                    <p className="text-xs mt-0.5 text-zowee-light/45">Dec 20–27 · Alert when under <span className="text-zowee-green font-semibold">$320</span></p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-zowee-light/30">Current best: <span className="text-zowee-light/65 font-medium">$387</span></span>
                      <span className="text-xs text-zowee-light/20">·</span>
                      <span className="text-xs text-zowee-light/30">Last checked 3 min ago</span>
                    </div>
                  </div>
                  <button onClick={() => openCancelModal('monitor', 'NYC → LAX flight')} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                    Cancel
                  </button>
                </div>
              </div>

              {/* Product Monitor */}
              <div className="rounded-2xl px-4 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-orange-500/10 border border-orange-500/20">
                    <span className="text-[17px]">🛍️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">Product</span>
                      <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-zowee-light/35">Checking every hour</span>
                    </div>
                    <p className="text-sm font-semibold text-zowee-light">Sony WH-1000XM5 Headphones</p>
                    <p className="text-xs mt-0.5 text-zowee-light/45">Amazon · Alert when under <span className="text-zowee-green font-semibold">$280</span></p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-zowee-light/30">Current price: <span className="text-zowee-light/65 font-medium">$329</span></span>
                      <span className="text-xs text-zowee-light/20">·</span>
                      <span className="text-xs text-zowee-light/30">Last checked 42 min ago</span>
                    </div>
                  </div>
                  <button onClick={() => openCancelModal('monitor', 'Sony WH-1000XM5 price')} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                    Cancel
                  </button>
                </div>
              </div>

              {/* Hotel Monitor */}
              <div className="rounded-2xl px-4 py-4 bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-purple-500/10 border border-purple-500/20">
                    <span className="text-[17px]">🏨</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">Hotel</span>
                      <div className="w-1.5 h-1.5 bg-zowee-green rounded-full animate-pulse"></div>
                      <span className="text-xs text-zowee-light/35">Checking every 30 min</span>
                    </div>
                    <p className="text-sm font-semibold text-zowee-light">The Standard, Miami Beach</p>
                    <p className="text-xs mt-0.5 text-zowee-light/45">Dec 20–23 · Alert when under <span className="text-zowee-green font-semibold">$180/night</span></p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-zowee-light/30">Current rate: <span className="text-zowee-light/65 font-medium">$224/night</span></span>
                      <span className="text-xs text-zowee-light/20">·</span>
                      <span className="text-xs text-zowee-light/30">Last checked 18 min ago</span>
                    </div>
                  </div>
                  <button onClick={() => openCancelModal('monitor', 'The Standard hotel')} className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Reminders */}
          <section className="pb-7 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">Upcoming Reminders</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zowee-green/10 border border-zowee-green/20 text-zowee-green/80">4 active</span>
            </div>

            <div className="rounded-2xl overflow-hidden bg-white/2 border border-white/5">
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-zowee-green/8 border border-zowee-green/18">
                  <span className="text-sm">💊</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zowee-light">Take vitamins</p>
                  <p className="text-xs mt-0.5 text-zowee-light/40">Daily · 8:00 AM</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-zowee-green/8 text-zowee-green/70 border border-zowee-green/15">Tomorrow</span>
                  <button onClick={() => openCancelModal('reminder', 'Take vitamins')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">Cancel</button>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-500/8 border border-orange-500/18">
                  <span className="text-sm">📞</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zowee-light">Call Mom back</p>
                  <p className="text-xs mt-0.5 text-zowee-light/40">One-time · Dec 18 at 6:00 PM</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-orange-500/8 text-orange-400/80 border border-orange-500/18">Dec 18</span>
                  <button onClick={() => openCancelModal('reminder', 'Call Mom')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">Cancel</button>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/8 border border-blue-500/18">
                  <span className="text-sm">🎁</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zowee-light">Order holiday gifts</p>
                  <p className="text-xs mt-0.5 text-zowee-light/40">One-time · Dec 19 at 10:00 AM</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-blue-500/8 text-blue-400/80 border border-blue-500/18">Dec 19</span>
                  <button onClick={() => openCancelModal('reminder', 'Order holiday gifts')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">Cancel</button>
                </div>
              </div>
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-500/8 border border-purple-500/18">
                  <span className="text-sm">🏋️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zowee-light">Gym session</p>
                  <p className="text-xs mt-0.5 text-zowee-light/40">Weekly · Mon/Wed/Fri at 7:00 AM</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-purple-500/8 text-purple-400/80 border border-purple-500/18">Dec 20</span>
                  <button onClick={() => openCancelModal('reminder', 'Gym session')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-zowee-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">Cancel</button>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="pb-7 animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-zowee-light/45 tracking-wider uppercase">Recent Activity</p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-white/2 border border-white/5">
              {/* Today Group */}
              <div className="px-4 py-2.5 bg-white/2 border-b border-white/5">
                <p className="text-xs font-semibold text-zowee-light/35 tracking-wide uppercase">Today</p>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-500/8 border border-blue-500/15">
                  <span className="text-[13px]">✈️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400">Flight</span>
                    <span className="text-xs text-zowee-light/30">9:42 AM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"Find me the cheapest flight from NYC to LAX in December"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Found 12 options · Monitor set up ✓</p>
                </div>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-orange-500/8 border border-orange-500/15">
                  <span className="text-[13px]">🛍️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-400">Product</span>
                    <span className="text-xs text-zowee-light/30">8:15 AM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"Track Sony WH-1000XM5 on Amazon, alert me under $280"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Currently $329 · Watching for drops ✓</p>
                </div>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-zowee-green/8 border border-zowee-green/15">
                  <span className="text-[13px]">⏰</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-zowee-green/10 text-zowee-green">Reminder</span>
                    <span className="text-xs text-zowee-light/30">7:30 AM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"Remind me to order holiday gifts on Dec 19"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Scheduled for Dec 19 at 10:00 AM ✓</p>
                </div>
              </div>

              {/* Yesterday Group */}
              <div className="px-4 py-2.5 bg-white/2 border-y border-white/5">
                <p className="text-xs font-semibold text-zowee-light/35 tracking-wide uppercase">Yesterday</p>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-purple-500/8 border border-purple-500/15">
                  <span className="text-[13px]">🏨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-400">Hotel</span>
                    <span className="text-xs text-zowee-light/30">6:55 PM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"Find hotels in Miami Beach Dec 20–23 under $180/night"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Found 8 options · Monitor active ✓</p>
                </div>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3 border-b border-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-yellow-500/6 border border-yellow-500/15">
                  <span className="text-[13px]">🔍</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-yellow-500/10 text-yellow-400">Research</span>
                    <span className="text-xs text-zowee-light/30">3:20 PM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"What's the best time to visit Japan in spring?"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Sent detailed summary via SMS ✓</p>
                </div>
              </div>

              <div className="px-4 py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-pink-500/8 border border-pink-500/15">
                  <span className="text-[13px]">🍽️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-400">Restaurant</span>
                    <span className="text-xs text-zowee-light/30">12:05 PM</span>
                  </div>
                  <p className="text-sm text-zowee-light/80">"Best Italian restaurants in NYC under $50 per person"</p>
                  <p className="text-xs mt-1 text-zowee-light/40">Sent top 5 picks with ratings ✓</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  )
}
