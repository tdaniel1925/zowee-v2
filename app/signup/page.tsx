'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

export default function SignupPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'family'>('solo')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format phone number as user types: (555) 000-0000
  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 10) raw = raw.slice(0, 10)

    let formatted = ''
    if (raw.length === 0) {
      formatted = ''
    } else if (raw.length <= 3) {
      formatted = '(' + raw
    } else if (raw.length <= 6) {
      formatted = '(' + raw.slice(0, 3) + ') ' + raw.slice(3)
    } else {
      formatted = '(' + raw.slice(0, 3) + ') ' + raw.slice(3, 6) + '-' + raw.slice(6)
    }

    setPhone(formatted)
    if (phoneError && raw.length === 10) {
      setPhoneError('')
    }
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (nameError && e.target.value.trim().length > 0) {
      setNameError('')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setApiError('')

    let valid = true

    // Validate name
    const nameVal = name.trim()
    if (nameVal.length < 2 || !nameVal.includes(' ')) {
      setNameError('Please enter your first and last name')
      valid = false
    } else {
      setNameError('')
    }

    // Validate phone
    const phoneRaw = phone.replace(/\D/g, '')
    if (phoneRaw.length !== 10) {
      setPhoneError('Please enter a valid 10-digit US mobile number')
      valid = false
    } else {
      setPhoneError('')
    }

    if (!valid) return

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal,
          phone: phoneRaw,
          plan: selectedPlan,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error || 'Something went wrong. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Success - redirect to success page
      router.push('/signup/success')
    } catch (error) {
      setApiError('Network error. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-20" style={{ background: 'radial-gradient(ellipse, rgba(0,232,122,0.35) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
        <div className="absolute bottom-40 left-1/4 w-64 h-64 opacity-10" style={{ background: 'radial-gradient(circle, rgba(0,200,255,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 opacity-10" style={{ background: 'radial-gradient(circle, rgba(0,232,122,0.3) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>
      </div>

      <div className="min-h-screen bg-zowee-dark pt-[60px] px-4 pb-20 relative z-10">
        <section className="py-12 flex flex-col items-center">

          {/* Logo + Tagline */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-zowee-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                <span className="font-heading font-extrabold text-zowee-dark text-base tracking-tight">Z</span>
              </div>
              <span className="font-heading font-bold text-3xl text-zowee-light tracking-tight">ZOWEE</span>
            </div>
            <p className="text-sm font-medium text-zowee-light/45">Your AI assistant, delivered by SMS</p>
          </div>

          {/* Main Signup Card */}
          <div
            className="w-full max-w-[480px] rounded-2xl p-8 animate-fade-in-up"
            style={{
              background: 'linear-gradient(145deg, #111118, #0E0E16)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,232,122,0.06)',
              animationDelay: '0.2s',
              opacity: 0,
              animationFillMode: 'forwards'
            }}
          >
            {/* Card Header */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4" style={{ background: 'rgba(0,232,122,0.12)', border: '1px solid rgba(0,232,122,0.3)' }}>
                <span className="text-xs font-semibold text-zowee-green tracking-wider">✦ NO CREDIT CARD NEEDED</span>
              </div>
              <h1 className="font-heading font-bold text-[1.75rem] tracking-tight text-zowee-light leading-tight mb-2">
                Start your free<br />
                <span className="bg-gradient-to-r from-zowee-green to-[#00C8FF] bg-clip-text text-transparent">2-week trial</span>
              </h1>
              <p className="text-sm text-zowee-light/45 leading-relaxed">
                Set up in 30 seconds. Cancel anytime. No app to download.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Name Field */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2 text-zowee-light/60 tracking-wide">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full px-4 py-3 rounded-lg text-sm bg-white/5 border ${
                    nameError ? 'border-red-500/60 bg-red-500/5 shadow-[0_0_0_3px_rgba(255,80,80,0.08)]' : 'border-white/10'
                  } text-zowee-light placeholder:text-zowee-light/30 transition-all outline-none focus:border-zowee-green/50 focus:bg-zowee-green/5 focus:shadow-[0_0_0_3px_rgba(0,232,122,0.08)]`}
                  placeholder="First & last name"
                  autoComplete="name"
                />
                {nameError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                    <span>⚠</span>
                    <span>{nameError}</span>
                  </div>
                )}
              </div>

              {/* Mobile Number Field */}
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-2 text-zowee-light/60 tracking-wide">
                  MOBILE NUMBER
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-sm">🇺🇸</span>
                    <span className="text-sm font-medium text-zowee-light/40">+1</span>
                    <span className="text-white/10 text-base">|</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full py-3 pl-[72px] pr-4 rounded-lg text-sm bg-white/5 border ${
                      phoneError
                        ? 'border-red-500/60 bg-red-500/5 shadow-[0_0_0_3px_rgba(255,80,80,0.08)]'
                        : phone.replace(/\D/g, '').length === 10
                        ? 'border-zowee-green/40'
                        : 'border-white/10'
                    } text-zowee-light placeholder:text-zowee-light/30 transition-all outline-none focus:border-zowee-green/50 focus:bg-zowee-green/5 focus:shadow-[0_0_0_3px_rgba(0,232,122,0.08)]`}
                    placeholder="(555) 000-0000"
                    maxLength={14}
                    autoComplete="tel"
                  />
                </div>
                {phoneError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
                    <span>⚠</span>
                    <span>{phoneError}</span>
                  </div>
                )}
                <p className="text-xs mt-2 text-zowee-light/30">
                  We'll send your Zowee number to this phone via SMS
                </p>
              </div>

              {/* Plan Selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold mb-3 text-zowee-light/60 tracking-wide">
                  CHOOSE YOUR PLAN
                </label>
                <div className="grid grid-cols-2 gap-3">

                  {/* Solo Plan */}
                  <div
                    className={`rounded-2xl p-4 cursor-pointer transition-all ${
                      selectedPlan === 'solo'
                        ? 'border-zowee-green/60 bg-zowee-green/7 shadow-[0_0_20px_rgba(0,232,122,0.08)]'
                        : 'border-white/8 bg-white/3 hover:border-zowee-green/30 hover:bg-zowee-green/3'
                    }`}
                    style={{ border: '1.5px solid' }}
                    onClick={() => setSelectedPlan('solo')}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedPlan === 'solo' ? 'border-zowee-green bg-zowee-green/15' : 'border-white/20'
                      }`}>
                        {selectedPlan === 'solo' && <div className="w-2 h-2 rounded-full bg-zowee-green" />}
                      </div>
                      <span className="text-lg">👤</span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-zowee-light tracking-tight mb-1">Solo</h3>
                    <p className="text-xs text-zowee-light/40 mb-3 leading-snug">1 user, 1 number</p>
                    <div>
                      <span className="font-heading font-bold text-lg text-zowee-green">$15</span>
                      <span className="text-xs text-zowee-light/40">/mo</span>
                    </div>
                    <p className="text-xs mt-1 text-zowee-light/30">after trial</p>
                  </div>

                  {/* Family Plan */}
                  <div
                    className={`rounded-2xl p-4 cursor-pointer transition-all relative ${
                      selectedPlan === 'family'
                        ? 'border-zowee-green/60 bg-zowee-green/7 shadow-[0_0_20px_rgba(0,232,122,0.08)]'
                        : 'border-white/8 bg-white/3 hover:border-zowee-green/30 hover:bg-zowee-green/3'
                    }`}
                    style={{ border: '1.5px solid' }}
                    onClick={() => setSelectedPlan('family')}
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-zowee-green to-[#00C8FF] text-zowee-dark text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                        POPULAR
                      </span>
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        selectedPlan === 'family' ? 'border-zowee-green bg-zowee-green/15' : 'border-white/20'
                      }`}>
                        {selectedPlan === 'family' && <div className="w-2 h-2 rounded-full bg-zowee-green" />}
                      </div>
                      <span className="text-lg">👨‍👩‍👧‍👦</span>
                    </div>
                    <h3 className="font-heading font-bold text-sm text-zowee-light tracking-tight mb-1">Family</h3>
                    <p className="text-xs text-zowee-light/40 mb-3 leading-snug">Up to 5 members</p>
                    <div>
                      <span className="font-heading font-bold text-lg text-zowee-green">$24</span>
                      <span className="text-xs text-zowee-light/40">/mo</span>
                    </div>
                    <p className="text-xs mt-1 text-zowee-light/30">after trial</p>
                  </div>

                </div>
              </div>

              {/* API Error */}
              {apiError && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/25">
                  <div className="flex items-start gap-2.5">
                    <span className="text-red-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
                    <div>
                      <p className="text-sm font-semibold text-red-400">Something went wrong</p>
                      <p className="text-xs mt-0.5 text-red-400/70">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-lg text-base font-bold bg-zowee-green text-zowee-dark flex items-center justify-center gap-2.5 tracking-tight transition-all hover:bg-[#00FF88] hover:shadow-[0_0_30px_rgba(0,232,122,0.4),0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <span>Setting up your account...</span>
                    <div className="w-[18px] h-[18px] border-2 border-zowee-dark/30 border-t-zowee-dark rounded-full animate-spin" />
                  </>
                ) : (
                  <span>Start Free Trial →</span>
                )}
              </button>

              {/* Terms note */}
              <p className="text-center text-xs mt-3 text-zowee-light/25 leading-relaxed">
                By continuing, you agree to our{' '}
                <span className="text-zowee-light/45 underline cursor-pointer">Terms</span>
                {' '}and{' '}
                <span className="text-zowee-light/45 underline cursor-pointer">Privacy Policy</span>
              </p>

            </form>

            {/* Divider */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

            {/* Trust Signals Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zowee-green/15 border border-zowee-green/30 rounded-full text-[9px] text-zowee-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-zowee-light/70">No credit card</p>
                <p className="text-xs text-zowee-light/30">required</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zowee-green/15 border border-zowee-green/30 rounded-full text-[9px] text-zowee-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-zowee-light/70">Cancel anytime</p>
                <p className="text-xs text-zowee-light/30">no questions</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-zowee-green/15 border border-zowee-green/30 rounded-full text-[9px] text-zowee-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-zowee-light/70">256-bit SSL</p>
                <p className="text-xs text-zowee-light/30">encrypted</p>
              </div>
            </div>

          </div>

          {/* Below card: social proof */}
          <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-zowee-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-zowee-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-zowee-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-zowee-dark object-cover" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zowee-green text-[13px]">★★★★★</span>
              </div>
            </div>
            <p className="text-xs text-zowee-light/35">
              Joined by <span className="text-zowee-light/60 font-semibold">12,400+</span> users this month
            </p>
          </div>

          {/* Already have account */}
          <div className="mt-4 text-center animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-sm text-zowee-light/35">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-zowee-green no-underline">Sign in →</a>
            </p>
          </div>

          {/* Rep referral link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-zowee-light/25">
              Have a referral code?{' '}
              <a href="/signup/referral" className="font-medium text-zowee-light/45 underline">Enter it here</a>
            </p>
          </div>

        </section>
      </div>
    </>
  )
}
