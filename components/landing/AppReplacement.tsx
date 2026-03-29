export default function AppReplacement() {
  const oldApps = [
    'Expedia',
    'Priceline',
    'OpenTable',
    'Hotels.com',
    'Kayak',
    'Honey',
    'GasBuddy',
    'Google Alerts',
    'Flighty',
    'Yelp',
    'Price trackers',
    'Reminder apps',
  ]

  return (
    <section className="py-12 relative overflow-hidden" id="how-it-works">
      <div className="max-w-6xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-pokkit-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-1px' }}
          >
            One text. <span className="text-pokkit-green">Everything handled.</span>
          </h2>
          <p className="text-lg text-pokkit-muted-2 max-w-2xl mx-auto">
            Stop juggling dozens of apps. Pokkit replaces them all with simple text messages.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* LEFT: The old way */}
          <div className="relative">
            <div
              className="rounded-large p-8 border"
              style={{
                background: 'rgba(180,0,0,0.03)',
                borderColor: 'rgba(255,100,100,0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📱</span>
                <h3 className="font-display font-bold text-xl text-pokkit-light">The old way</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {oldApps.map((app, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-small bg-white/5 border border-white/5"
                  >
                    <span className="text-red-400 text-sm">✗</span>
                    <span className="text-sm text-pokkit-muted" style={{ textDecoration: 'line-through' }}>
                      {app}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-pokkit-muted mt-4 text-center">...and 47 more apps</p>
            </div>
          </div>

          {/* RIGHT: The Pokkit way */}
          <div className="relative">
            <div
              className="rounded-large p-8 border relative overflow-hidden"
              style={{
                background: 'rgba(0,232,122,0.03)',
                borderColor: 'rgba(0,232,122,0.2)',
              }}
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(0,232,122,0.3), transparent)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">💬</span>
                  <h3 className="font-display font-bold text-xl text-pokkit-light">The Pokkit way</h3>
                </div>

                {/* Phone mockup simplified */}
                <div
                  className="rounded-large p-4 mx-auto"
                  style={{
                    maxWidth: '280px',
                    background: 'linear-gradient(180deg, #111118 0%, #0A0A0F 100%)',
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* Single message bubble */}
                  <div className="flex justify-end mb-3">
                    <div
                      className="px-3 py-2 rounded-lg max-w-[220px]"
                      style={{ background: '#00E87A' }}
                    >
                      <p className="text-xs font-semibold" style={{ color: '#0A0A0F' }}>
                        Find me a flight to Dallas under $150 and book me at Perry&apos;s tonight
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div
                      className="px-3 py-2 rounded-lg max-w-[220px]"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <p className="text-xs" style={{ color: 'rgba(232,232,240,0.9)' }}>
                        ✅ Done! Flight booked ($127) and table reserved for 7pm.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-pokkit-green font-semibold mt-6 text-center">
                  One text. Both tasks handled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
