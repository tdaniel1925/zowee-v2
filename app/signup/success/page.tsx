'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'

type SetupStatus = 'processing' | 'complete' | 'error'

function SignupSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<SetupStatus>('processing')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [jordynNumber, setJordynNumber] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      setError('Invalid signup session. Please contact support.')
      return
    }

    // Call the completion endpoint
    async function completeSignup() {
      try {
        const res = await fetch('/api/signup/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setError(data.error || 'Failed to complete signup. Please contact support.')
          return
        }

        // Format the Jordyn number
        const number = data.user?.jordynNumber || ''
        if (number) {
          const cleaned = number.replace(/\D/g, '')
          if (cleaned.length === 11 && cleaned.startsWith('1')) {
            const formatted = `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
            setJordynNumber(formatted)
          } else if (cleaned.length === 10) {
            const formatted = `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
            setJordynNumber(formatted)
          } else {
            setJordynNumber(number)
          }
        }

        setUserName(data.user?.name || '')
        setStatus('complete')
      } catch (err: any) {
        console.error('Signup completion error:', err)
        setStatus('error')
        setError('Network error. Please refresh the page or contact support.')
      }
    }

    completeSignup()
  }, [searchParams])

  const copyNumber = () => {
    navigator.clipboard.writeText(jordynNumber.replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Processing state
  if (status === 'processing') {
    return (
      <>
        <Header />
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(0,232,122,0.4) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
        </div>
        <div className="min-h-screen bg-jordyn-dark pt-[60px] px-4 pb-24 relative z-10">
          <section className="py-12 flex flex-col items-center">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-jordyn-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                  <span className="font-heading font-extrabold text-jordyn-dark text-base tracking-tight">J</span>
                </div>
                <span className="font-heading font-bold text-3xl text-jordyn-light tracking-tight">JORDYN</span>
              </div>
            </div>
            <div className="w-full max-w-[480px] rounded-2xl p-10" style={{ background: 'linear-gradient(145deg, #111118, #0E0E16)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,232,122,0.06)' }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-6 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-jordyn-green/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-jordyn-green border-t-transparent animate-spin"></div>
                </div>
                <h1 className="font-heading font-bold text-2xl text-jordyn-light mb-3">Setting up your account...</h1>
                <p className="text-sm text-jordyn-light/50 max-w-[320px]">We're provisioning your personal Jordyn number and setting up your AI assistant. This takes about 30 seconds.</p>
              </div>
            </div>
          </section>
        </div>
      </>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <>
        <Header />
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(255,80,80,0.3) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
        </div>
        <div className="min-h-screen bg-jordyn-dark pt-[60px] px-4 pb-24 relative z-10">
          <section className="py-12 flex flex-col items-center">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-jordyn-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                  <span className="font-heading font-extrabold text-jordyn-dark text-base tracking-tight">J</span>
                </div>
                <span className="font-heading font-bold text-3xl text-jordyn-light tracking-tight">JORDYN</span>
              </div>
            </div>
            <div className="w-full max-w-[480px] rounded-2xl p-10" style={{ background: 'linear-gradient(145deg, #111118, #0E0E16)', border: '1px solid rgba(255,80,80,0.15)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-3xl">⚠</span>
                </div>
                <h1 className="font-heading font-bold text-2xl text-jordyn-light mb-3">Setup Error</h1>
                <p className="text-sm text-red-400/80 mb-6">{error}</p>
                <a
                  href="mailto:support@jordyn.app"
                  className="px-6 py-3 rounded-lg bg-jordyn-green text-jordyn-dark font-semibold text-sm hover:bg-[#00FF88] transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </section>
        </div>
      </>
    )
  }

  // Success state
  return (
    <>
      <Header />
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(0,232,122,0.4) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
      </div>
      <div className="min-h-screen bg-jordyn-dark pt-[60px] px-4 pb-24 relative z-10">
        <section className="py-12 flex flex-col items-center">
          <div className="text-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-jordyn-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                <span className="font-heading font-extrabold text-jordyn-dark text-base tracking-tight">J</span>
              </div>
              <span className="font-heading font-bold text-3xl text-jordyn-light tracking-tight">JORDYN</span>
            </div>
          </div>
          <div className="w-full max-w-[480px] rounded-2xl p-10" style={{ background: 'linear-gradient(145deg, #111118, #0E0E16)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,232,122,0.06)' }}>
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-jordyn-green/20 to-[#00C8FF]/10 flex items-center justify-center">
                  <svg className="w-11 h-11" viewBox="0 0 44 44" fill="none">
                    <path d="M10 22L18.5 31L34 14" stroke="#00E87A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="0" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h1 className="font-heading font-bold text-[2.1rem] tracking-tight text-jordyn-light leading-tight mb-3">You're in! 🎉</h1>
                <p className="text-sm leading-relaxed text-jordyn-light/55 max-w-[320px] mx-auto">Check your phone — your welcome text is on its way.</p>
              </div>
            </div>
            <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
            <div className="mb-7">
              <p className="text-xs font-semibold mb-3 text-center text-jordyn-light/45 tracking-wider uppercase">Your Jordyn Number</p>
              <div className="rounded-2xl px-6 py-5 text-center relative overflow-hidden" style={{ background: 'rgba(0,232,122,0.04)', border: '1px solid rgba(0,232,122,0.15)' }}>
                <p className="font-heading font-bold text-[1.85rem] tracking-[2px] text-jordyn-green leading-tight relative z-10">{jordynNumber}</p>
                <p className="text-xs mt-2 text-jordyn-light/35 relative z-10">Save this number to start texting Jordyn</p>
                <button onClick={copyNumber} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold relative z-10 transition-all" style={{ background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.25)', color: '#00E87A' }}>
                  <span>{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>
            </div>
            <div className="mb-7">
              <p className="text-xs font-semibold mb-3 text-jordyn-light/45 tracking-wider uppercase">Quick Start</p>
              <div className="space-y-2.5">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-jordyn-green/10 border border-jordyn-green/20">
                    <span className="text-sm">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-jordyn-light">Save your Jordyn number</p>
                    <p className="text-xs mt-0.5 text-jordyn-light/40">Add it to your contacts right now</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-jordyn-green/10 border border-jordyn-green/20">
                    <span className="text-sm">💬</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-jordyn-light">Send your first text</p>
                    <p className="text-xs mt-0.5 text-jordyn-light/40">Ask anything — flights, food, research</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-jordyn-green/10 border border-jordyn-green/20">
                    <span className="text-sm">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-jordyn-light">Get results in 60 seconds</p>
                    <p className="text-xs mt-0.5 text-jordyn-light/40">Jordyn responds fast, every time</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
            <div>
              <a href="/account" className="block w-full py-4 rounded-lg text-base font-bold bg-gradient-to-r from-jordyn-green to-[#00C066] text-jordyn-dark text-center transition-all hover:from-[#00FF88] hover:to-jordyn-green">View Your Dashboard →</a>
              <p className="text-center text-xs mt-3 text-jordyn-light/25">Manage your plan, number, and usage from your dashboard</p>
            </div>
          </div>
          <div className="mt-5 text-center max-w-[480px] w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-jordyn-green/7 border border-jordyn-green/18">
              <span className="text-[13px]">✅</span>
              <span className="text-xs font-medium text-jordyn-green/80">7-day free trial active · Cancel anytime</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-jordyn-dark pt-[60px] px-4 pb-24 flex items-center justify-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-jordyn-green/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-jordyn-green border-t-transparent animate-spin"></div>
          </div>
        </div>
      </>
    }>
      <SignupSuccessContent />
    </Suspense>
  )
}
