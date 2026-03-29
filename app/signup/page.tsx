'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

type PlanType = 'solo' | 'family' | 'solo_voice' | 'family_voice' | 'business'

export default function SignupPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('solo_voice')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nameError, setNameError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const plans = [
    { id: 'solo', name: 'Solo', price: 19, icon: '👤', desc: 'SMS only', popular: false, badge: '' },
    { id: 'family', name: 'Family', price: 34, icon: '👨‍👩‍👧‍👦', desc: 'Up to 5, SMS only', popular: false, badge: '' },
    { id: 'solo_voice', name: 'Solo + Voice', price: 39, icon: '📞', desc: '100 voice mins', popular: true, badge: '' },
    { id: 'family_voice', name: 'Family + Voice', price: 59, icon: '🎙️', desc: '200 voice mins', popular: false, badge: '' },
    { id: 'business', name: 'Business', price: 97, icon: '🏢', desc: 'Full features', popular: false, badge: 'Pro' },
  ] as const

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

      <div className="min-h-screen bg-pokkit-dark pt-[60px] px-4 pb-20 relative z-10">
        <section className="py-12 flex flex-col items-center">

          {/* Logo + Tagline */}
          <div className="text-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-pokkit-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                <span className="font-heading font-extrabold text-pokkit-dark text-base tracking-tight">Z</span>
              </div>
              <span className="font-heading font-bold text-3xl text-pokkit-light tracking-tight">POKKIT</span>
            </div>
            <p className="text-sm font-medium text-pokkit-light/45">Your AI assistant, delivered by SMS</p>
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
                <span className="text-xs font-semibold text-pokkit-green tracking-wider">✦ 7-DAY FREE TRIAL</span>
              </div>
              <h1 className="font-heading font-bold text-[1.75rem] tracking-tight text-pokkit-light leading-tight mb-2">
                Start your free<br />
                <span className="bg-gradient-to-r from-pokkit-green to-[#00C8FF] bg-clip-text text-transparent">7-day trial</span>
              </h1>
              <p className="text-sm text-pokkit-light/45 leading-relaxed">
                Set up in 30 seconds. Cancel anytime. No charge until trial ends.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>

              {/* Name Field */}
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-2 text-pokkit-light/60 tracking-wide">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className={`w-full px-4 py-3 rounded-lg text-sm bg-white/5 border ${
                    nameError ? 'border-red-500/60 bg-red-500/5 shadow-[0_0_0_3px_rgba(255,80,80,0.08)]' : 'border-white/10'
                  } text-pokkit-light placeholder:text-pokkit-light/30 transition-all outline-none focus:border-pokkit-green/50 focus:bg-pokkit-green/5 focus:shadow-[0_0_0_3px_rgba(0,232,122,0.08)]`}
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
                <label className="block text-xs font-semibold mb-2 text-pokkit-light/60 tracking-wide">
                  MOBILE NUMBER
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-sm">🇺🇸</span>
                    <span className="text-sm font-medium text-pokkit-light/40">+1</span>
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
                        ? 'border-pokkit-green/40'
                        : 'border-white/10'
                    } text-pokkit-light placeholder:text-pokkit-light/30 transition-all outline-none focus:border-pokkit-green/50 focus:bg-pokkit-green/5 focus:shadow-[0_0_0_3px_rgba(0,232,122,0.08)]`}
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
                <p className="text-xs mt-2 text-pokkit-light/30">
                  We'll send your Pokkit number to this phone via SMS
                </p>
              </div>

              {/* Plan Selector */}
              <div className="mb-6">
                <label className="block text-xs font-semibold mb-3 text-pokkit-light/60 tracking-wide">
                  CHOOSE YOUR PLAN
                </label>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-xl p-4 cursor-pointer transition-all relative ${
                        selectedPlan === plan.id
                          ? 'border-pokkit-green/60 bg-pokkit-green/7 shadow-[0_0_20px_rgba(0,232,122,0.08)]'
                          : 'border-white/8 bg-white/3 hover:border-pokkit-green/30 hover:bg-pokkit-green/3'
                      }`}
                      style={{ border: '1.5px solid' }}
                      onClick={() => setSelectedPlan(plan.id as PlanType)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 right-3">
                          <span className="bg-gradient-to-r from-pokkit-green to-[#00C8FF] text-pokkit-dark text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                            MOST POPULAR
                          </span>
                        </div>
                      )}
                      {plan.badge && (
                        <div className="absolute -top-2 right-3">
                          <span className="bg-pokkit-green text-pokkit-dark text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                            {plan.badge.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedPlan === plan.id ? 'border-pokkit-green bg-pokkit-green/15' : 'border-white/20'
                        }`}>
                          {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-pokkit-green" />}
                        </div>
                        <span className="text-xl flex-shrink-0">{plan.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-sm text-pokkit-light tracking-tight">{plan.name}</h3>
                          <p className="text-xs text-pokkit-light/40 truncate">{plan.desc}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-heading font-bold text-lg text-pokkit-green">${plan.price}</div>
                          <p className="text-xs text-pokkit-light/30">/mo</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 text-pokkit-light/30 text-center">
                  All plans include 14-day free trial • Voice plans include AI phone calls
                </p>
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
                className="w-full py-4 rounded-lg text-base font-bold bg-pokkit-green text-pokkit-dark flex items-center justify-center gap-2.5 tracking-tight transition-all hover:bg-[#00FF88] hover:shadow-[0_0_30px_rgba(0,232,122,0.4),0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <span>Setting up your account...</span>
                    <div className="w-[18px] h-[18px] border-2 border-pokkit-dark/30 border-t-pokkit-dark rounded-full animate-spin" />
                  </>
                ) : (
                  <span>Start Free Trial →</span>
                )}
              </button>

              {/* Terms note */}
              <p className="text-center text-xs mt-3 text-pokkit-light/25 leading-relaxed">
                By continuing, you agree to our{' '}
                <span className="text-pokkit-light/45 underline cursor-pointer">Terms</span>
                {' '}and{' '}
                <span className="text-pokkit-light/45 underline cursor-pointer">Privacy Policy</span>
              </p>

            </form>

            {/* Divider */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

            {/* Trust Signals Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-pokkit-green/15 border border-pokkit-green/30 rounded-full text-[9px] text-pokkit-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-pokkit-light/70">No credit card</p>
                <p className="text-xs text-pokkit-light/30">required</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-pokkit-green/15 border border-pokkit-green/30 rounded-full text-[9px] text-pokkit-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-pokkit-light/70">Cancel anytime</p>
                <p className="text-xs text-pokkit-light/30">no questions</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="flex items-center justify-center mb-1">
                  <span className="inline-flex items-center justify-center w-[18px] h-[18px] bg-pokkit-green/15 border border-pokkit-green/30 rounded-full text-[9px] text-pokkit-green font-bold flex-shrink-0">✓</span>
                </div>
                <p className="text-xs font-semibold text-pokkit-light/70">256-bit SSL</p>
                <p className="text-xs text-pokkit-light/30">encrypted</p>
              </div>
            </div>

          </div>

          {/* Below card: social proof */}
          <div className="mt-6 text-center animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-pokkit-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-pokkit-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-pokkit-dark object-cover" />
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="user" className="w-7 h-7 rounded-full border-2 border-pokkit-dark object-cover" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-pokkit-green text-[13px]">★★★★★</span>
              </div>
            </div>
            <p className="text-xs text-pokkit-light/35">
              Joined by <span className="text-pokkit-light/60 font-semibold">12,400+</span> users this month
            </p>
          </div>

          {/* Already have account */}
          <div className="mt-4 text-center animate-fade-in-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-sm text-pokkit-light/35">
              Already have an account?{' '}
              <a href="/login" className="font-semibold text-pokkit-green no-underline">Sign in →</a>
            </p>
          </div>

          {/* Rep referral link */}
          <div className="mt-3 text-center">
            <p className="text-xs text-pokkit-light/25">
              Have a referral code?{' '}
              <a href="/signup/referral" className="font-medium text-pokkit-light/45 underline">Enter it here</a>
            </p>
          </div>

        </section>
      </div>
    </>
  )
}
