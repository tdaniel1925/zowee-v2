'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function IntegrationsPage() {
  const [alexaLinked, setAlexaLinked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if Alexa is already linked
    checkAlexaStatus()
  }, [])

  const checkAlexaStatus = async () => {
    try {
      const res = await fetch('/api/integrations/alexa/status')
      const data = await res.json()
      setAlexaLinked(data.linked || false)
    } catch (error) {
      console.error('Error checking Alexa status:', error)
    }
  }

  const linkAlexa = () => {
    // Redirect to Alexa OAuth flow
    const clientId = process.env.NEXT_PUBLIC_ALEXA_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/alexa/callback`
    const scope = 'alexa::skills:account_linking alexa::household:profile:read'

    const alexaAuthUrl = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`

    window.location.href = alexaAuthUrl
  }

  const unlinkAlexa = async () => {
    if (!confirm('Unlink Alexa? You won\'t be able to control smart home devices via SMS.')) return

    try {
      setLoading(true)
      await fetch('/api/integrations/alexa/unlink', { method: 'POST' })
      setAlexaLinked(false)
    } catch (error) {
      console.error('Error unlinking Alexa:', error)
      alert('Failed to unlink Alexa')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-pokkit-green">
              <span className="font-heading font-extrabold text-pokkit-dark text-[11px] tracking-tight">
                Z
              </span>
            </div>
            <Link
              href="/account"
              className="font-heading font-bold text-xl text-pokkit-light tracking-tight no-underline"
            >
              POKKIT
            </Link>
          </div>
          <Link
            href="/account"
            className="text-sm font-medium text-pokkit-light/60 hover:text-pokkit-light transition-colors no-underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-pokkit-dark pt-[60px]">
        <div className="max-w-3xl mx-auto px-4 relative z-10 py-12">
          <h1 className="font-heading font-bold text-2xl text-pokkit-light tracking-tight mb-2">
            Integrations
          </h1>
          <p className="text-sm text-pokkit-light/45 mb-8">
            Connect your smart home and other services
          </p>

          {/* Alexa Integration */}
          <div className="rounded-2xl p-6 bg-white/3 border border-white/8 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex-shrink-0">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#00CAFF"/>
                  <path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" fill="white"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-heading font-bold text-lg text-pokkit-light">
                    Amazon Alexa
                  </h3>
                  {alexaLinked && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-pokkit-green/10 text-pokkit-green border border-pokkit-green/20">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-pokkit-light/60 mb-4">
                  Control your smart home devices via SMS. Turn lights on/off, adjust thermostat,
                  lock doors, and more - all from text messages.
                </p>

                {!alexaLinked ? (
                  <>
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                      <p className="text-xs text-blue-400 mb-2 font-semibold">What you can do:</p>
                      <ul className="text-xs text-pokkit-light/60 space-y-1">
                        <li>• "Turn off living room lights"</li>
                        <li>• "Set thermostat to 72 degrees"</li>
                        <li>• "Lock the front door"</li>
                        <li>• "Dim bedroom lights to 50%"</li>
                      </ul>
                    </div>
                    <button
                      onClick={linkAlexa}
                      className="px-6 py-3 rounded-lg text-sm font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all"
                    >
                      Link Amazon Alexa
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-pokkit-green/5 border border-pokkit-green/15">
                      <p className="text-xs text-pokkit-green/80">
                        ✓ Your Alexa account is connected. Text Pokkit to control your devices!
                      </p>
                    </div>
                    <button
                      onClick={unlinkAlexa}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-pokkit-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all disabled:opacity-50"
                    >
                      Unlink
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coming Soon: Other Integrations */}
          <div className="rounded-2xl p-6 bg-white/2 border border-white/5">
            <h3 className="font-heading font-bold text-base text-pokkit-light mb-3">
              More Integrations Coming Soon
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📺</span>
                  <span className="text-sm font-semibold text-pokkit-light">Google Home</span>
                </div>
                <p className="text-xs text-pokkit-light/40">Smart home control</p>
              </div>
              <div className="p-3 rounded-lg bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🎵</span>
                  <span className="text-sm font-semibold text-pokkit-light">Spotify</span>
                </div>
                <p className="text-xs text-pokkit-light/40">Music control</p>
              </div>
              <div className="p-3 rounded-lg bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📅</span>
                  <span className="text-sm font-semibold text-pokkit-light">Google Calendar</span>
                </div>
                <p className="text-xs text-pokkit-light/40">Calendar management</p>
              </div>
              <div className="p-3 rounded-lg bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">🚗</span>
                  <span className="text-sm font-semibold text-pokkit-light">Tesla</span>
                </div>
                <p className="text-xs text-pokkit-light/40">Car control</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
