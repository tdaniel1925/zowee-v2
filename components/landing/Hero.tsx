'use client'

import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import AnimatedSmsDemo from '../ui/AnimatedSmsDemo'

const cyclingWords = ['Delete your apps', 'Book flights', 'Track prices', 'Research anything']

export default function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % cyclingWords.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center" style={{ paddingTop: '80px' }}>
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,232,122,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,100,255,0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16 lg:py-24">
          {/* LEFT: Text Content */}
          <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-small mb-6 bg-pokkit-green-glow border border-pokkit-green/20">
              <span className="text-xs font-semibold text-pokkit-green" style={{ letterSpacing: '0.5px' }}>
                ✦ NO APP NEEDED
              </span>
            </div>

            {/* Headline with cycling word */}
            <div className="mb-4">
              <h1
                className="font-display font-bold leading-none mb-2 text-pokkit-light"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', letterSpacing: '-1.5px' }}
              >
                <span
                  key={currentWordIndex}
                  className="inline-block animate-fade-in-up bg-gradient-to-r from-pokkit-green to-blue-400 bg-clip-text text-transparent"
                >
                  {cyclingWords[currentWordIndex]}
                </span>
              </h1>
              <h1
                className="font-display font-bold leading-none text-pokkit-light"
                style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', letterSpacing: '-1.5px' }}
              >
                via text.
              </h1>
            </div>

            {/* Subline */}
            <p className="text-lg font-medium mb-8 text-pokkit-muted-2" style={{ letterSpacing: '0.2px' }}>
              Text <span className="font-semibold text-pokkit-light">Pokkit.</span> Get anything done — flights, prices,
              research, reservations — all from your messages.
            </p>

            {/* Stat Pills */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
              <div className="flex items-center gap-2 px-3 py-2 rounded-small bg-white/5 border border-white/10">
                <span className="text-base">⚡</span>
                <span className="text-sm font-semibold text-pokkit-light">Under 60s</span>
                <span className="text-xs text-pokkit-muted">avg response</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-small bg-white/5 border border-white/10">
                <span className="text-base">🌍</span>
                <span className="text-sm font-semibold text-pokkit-light">50K+</span>
                <span className="text-xs text-pokkit-muted">tasks done</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-small bg-white/5 border border-white/10">
                <span className="text-base">💬</span>
                <span className="text-sm font-semibold text-pokkit-light">SMS only</span>
                <span className="text-xs text-pokkit-muted">no app needed</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Button href="/signup" size="lg" className="w-full sm:w-auto min-w-[200px]">
                Start for Free →
              </Button>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 text-sm font-medium text-pokkit-muted hover:text-pokkit-green transition-colors"
              >
                <span>See how it works</span>
                <span className="text-pokkit-green">↓</span>
              </a>
            </div>

            {/* Social proof micro */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mt-6">
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-pokkit-dark"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-pokkit-dark"
                />
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-pokkit-dark"
                />
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                  alt="user"
                  className="w-8 h-8 rounded-full border-2 border-pokkit-dark"
                />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-pokkit-green text-xs">★★★★★</span>
                </div>
                <p className="text-xs text-pokkit-muted">Loved by 2,400+ users</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Phone Mockup */}
          <div className="flex-shrink-0 relative">
            <AnimatedSmsDemo />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0F)' }}
      />
    </section>
  )
}
