'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/account'
  const supabase = createClient()

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in existing user
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Supabase automatically sets cookies ✅
        router.push(redirect)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,229,180,0.45) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-40 left-1/4 w-64 h-64 opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(0,200,255,0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-16">
        <div className="flex flex-col items-center max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{
                  background: '#00E5B4',
                  boxShadow: '0 0 28px rgba(0,229,180,0.45)',
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    color: '#0A0A0F',
                    fontSize: '17px',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Z
                </span>
              </div>
              <span
                className="font-bold text-3xl"
                style={{
                  color: '#E8E8F0',
                  letterSpacing: '-1px',
                }}
              >
                ZOWEE
              </span>
            </div>
            <h1
              className="font-bold mb-2"
              style={{
                fontSize: '1.75rem',
                letterSpacing: '-0.75px',
                color: '#E8E8F0',
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </h1>
            <p
              className="text-sm mx-auto"
              style={{
                color: 'rgba(232,232,240,0.45)',
                maxWidth: '280px',
                lineHeight: 1.6,
              }}
            >
              Sign in to access your AI assistant
            </p>
          </div>

          {/* Login Card */}
          <div
            className="w-full rounded-2xl p-8 animate-fade-in-up"
            style={{
              background: 'linear-gradient(145deg, #111118, #0E0E16)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,229,180,0.06)',
              animationDelay: '0.2s',
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
                      e.target.style.background = 'rgba(0,229,180,0.04)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,229,180,0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              )}

              {/* Email field */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{
                    color: 'rgba(232,232,240,0.5)',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'rgba(232,232,240,0.3)' }}
                  >
                    ✉️
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3.5 rounded-lg text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#E8E8F0',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(0,229,180,0.5)'
                      e.target.style.background = 'rgba(0,229,180,0.04)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,229,180,0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  className="block text-xs font-semibold mb-2"
                  style={{
                    color: 'rgba(232,232,240,0.5)',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'rgba(232,232,240,0.3)' }}
                  >
                    🔒
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-4 py-3.5 rounded-lg text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#E8E8F0',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(0,229,180,0.5)'
                      e.target.style.background = 'rgba(0,229,180,0.04)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,229,180,0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-2"
                  style={{ color: 'rgba(232,232,240,0.3)' }}
                >
                  Forgot password?{' '}
                  <Link
                    href="/forgot-password"
                    className="font-semibold hover:underline"
                    style={{ color: 'rgba(0,229,180,0.7)' }}
                  >
                    Reset it
                  </Link>
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255,80,80,0.08)',
                    border: '1px solid rgba(255,80,80,0.2)',
                    color: 'rgba(255,120,120,0.9)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: loading ? '#555' : '#00E5B4',
                  color: '#0A0A0F',
                  letterSpacing: '-0.2px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#00FFB8'
                    e.currentTarget.style.boxShadow =
                      '0 0 40px rgba(0,229,180,0.45), 0 8px 24px rgba(0,0,0,0.3)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#00E5B4'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }
                }}
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#0A0A0F', borderTopColor: 'transparent' }}
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>🔑</span>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'rgba(232,232,240,0.4)' }}>
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold transition-colors duration-200"
                  style={{ color: 'rgba(0,229,180,0.7)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00E5B4')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(0,229,180,0.7)')}
                >
                  Start your free trial
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div
            className="mt-6 w-full grid grid-cols-3 gap-2 animate-fade-in-up"
            style={{
              animationDelay: '0.4s',
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <div
              className="rounded-lg px-3 py-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(232,232,240,0.7)' }}>
                🔐 Secure
              </p>
              <p style={{ color: 'rgba(232,232,240,0.3)', fontSize: '10px' }}>
                End-to-end encrypted
              </p>
            </div>
            <div
              className="rounded-lg px-3 py-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(232,232,240,0.7)' }}>
                ⚡ Instant
              </p>
              <p style={{ color: 'rgba(232,232,240,0.3)', fontSize: '10px' }}>
                Start in seconds
              </p>
            </div>
            <div
              className="rounded-lg px-3 py-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(232,232,240,0.7)' }}>
                🛡️ Private
              </p>
              <p style={{ color: 'rgba(232,232,240,0.3)', fontSize: '10px' }}>
                Never sell your data
              </p>
            </div>
          </div>

          {/* Bottom links */}
          <div
            className="mt-6 flex items-center gap-4 justify-center animate-fade-in-up"
            style={{
              animationDelay: '0.6s',
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <Link
              href="/"
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: 'rgba(232,232,240,0.3)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.3)')}
            >
              Home
            </Link>
            <span style={{ color: 'rgba(232,232,240,0.15)' }}>·</span>
            <Link
              href="/#pricing"
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: 'rgba(232,232,240,0.3)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.3)')}
            >
              Pricing
            </Link>
            <span style={{ color: 'rgba(232,232,240,0.15)' }}>·</span>
            <a
              href="#"
              className="text-xs font-medium transition-colors duration-200"
              style={{ color: 'rgba(232,232,240,0.3)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.6)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(232,232,240,0.3)')}
            >
              Privacy
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(24px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease forwards;
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
      <LoginForm />
    </Suspense>
  )
}
