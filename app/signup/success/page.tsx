'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'

export default function SignupSuccessPage() {
  const [copied, setCopied] = useState(false)
  const pokkitNumber = '+1 (555) 209-4471'

  const copyNumber = () => {
    navigator.clipboard.writeText(pokkitNumber.replace(/\D/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Header />
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-25" style={{ background: 'radial-gradient(ellipse, rgba(0,232,122,0.4) 0%, transparent 65%)', filter: 'blur(80px)' }}></div>
      </div>
      <div className="min-h-screen bg-pokkit-dark pt-[60px] px-4 pb-24 relative z-10">
        <section className="py-12 flex flex-col items-center">
          <div className="text-center mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-pokkit-green shadow-[0_0_24px_rgba(0,232,122,0.4)]">
                <span className="font-heading font-extrabold text-pokkit-dark text-base tracking-tight">Z</span>
              </div>
              <span className="font-heading font-bold text-3xl text-pokkit-light tracking-tight">POKKIT</span>
            </div>
          </div>
          <div className="w-full max-w-[480px] rounded-2xl p-10" style={{ background: 'linear-gradient(145deg, #111118, #0E0E16)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,232,122,0.06)' }}>
            <div className="flex flex-col items-center mb-8">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pokkit-green/20 to-[#00C8FF]/10 flex items-center justify-center">
                  <svg className="w-11 h-11" viewBox="0 0 44 44" fill="none">
                    <path d="M10 22L18.5 31L34 14" stroke="#00E87A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="0" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h1 className="font-heading font-bold text-[2.1rem] tracking-tight text-pokkit-light leading-tight mb-3">You're in! 🎉</h1>
                <p className="text-sm leading-relaxed text-pokkit-light/55 max-w-[320px] mx-auto">Check your phone — your welcome text is on its way.</p>
              </div>
            </div>
            <div className="my-7 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
            <div className="mb-7">
              <p className="text-xs font-semibold mb-3 text-center text-pokkit-light/45 tracking-wider uppercase">Your Pokkit Number</p>
              <div className="rounded-2xl px-6 py-5 text-center relative overflow-hidden" style={{ background: 'rgba(0,232,122,0.04)', border: '1px solid rgba(0,232,122,0.15)' }}>
                <p className="font-heading font-bold text-[1.85rem] tracking-[2px] text-pokkit-green leading-tight relative z-10">{pokkitNumber}</p>
                <p className="text-xs mt-2 text-pokkit-light/35 relative z-10">Save this number to start texting Pokkit</p>
                <button onClick={copyNumber} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold relative z-10 transition-all" style={{ background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.25)', color: '#00E87A' }}>
                  <span>{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>
            </div>
            <div className="mb-7">
              <p className="text-xs font-semibold mb-3 text-pokkit-light/45 tracking-wider uppercase">Quick Start</p>
              <div className="space-y-2.5">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-pokkit-green/10 border border-pokkit-green/20">
                    <span className="text-sm">📱</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-pokkit-light">Save your Pokkit number</p>
                    <p className="text-xs mt-0.5 text-pokkit-light/40">Add it to your contacts right now</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-pokkit-green/10 border border-pokkit-green/20">
                    <span className="text-sm">💬</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-pokkit-light">Send your first text</p>
                    <p className="text-xs mt-0.5 text-pokkit-light/40">Ask anything — flights, food, research</p>
                  </div>
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3 bg-white/2 border border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-pokkit-green/10 border border-pokkit-green/20">
                    <span className="text-sm">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-pokkit-light">Get results in 60 seconds</p>
                    <p className="text-xs mt-0.5 text-pokkit-light/40">Pokkit responds fast, every time</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />
            <div>
              <a href="/account" className="block w-full py-4 rounded-lg text-base font-bold bg-gradient-to-r from-pokkit-green to-[#00C066] text-pokkit-dark text-center transition-all hover:from-[#00FF88] hover:to-pokkit-green">View Your Dashboard →</a>
              <p className="text-center text-xs mt-3 text-pokkit-light/25">Manage your plan, number, and usage from your dashboard</p>
            </div>
          </div>
          <div className="mt-5 text-center max-w-[480px] w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pokkit-green/7 border border-pokkit-green/18">
              <span className="text-[13px]">✅</span>
              <span className="text-xs font-medium text-pokkit-green/80">14-day free trial active · Cancel anytime</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
