import Button from '../ui/Button'
import Link from 'next/link'

export default function Footer() {
  return (
    <>
      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(0,232,122,0.15), transparent)',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2
            className="font-display font-bold text-Jordyn-light mb-6"
            style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', letterSpacing: '-1px' }}
          >
            Start texting Jordyn today
          </h2>

          <p className="text-lg text-Jordyn-muted-2 mb-8 max-w-2xl mx-auto">
            Join thousands who&apos;ve deleted their apps and simplified their lives.
          </p>

          <Button href="/signup" size="lg" className="mb-4">
            Start 7-Day Free Trial →
          </Button>

          <p className="text-sm text-Jordyn-muted">
            $19/month after trial. Cancel anytime by text.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-small flex items-center justify-center"
                style={{ background: '#00E87A' }}
              >
                <span
                  className="font-display font-800 text-xs"
                  style={{ color: '#0A0A0F', fontWeight: 800, letterSpacing: '-0.5px' }}
                >
                  Z
                </span>
              </div>
              <span
                className="font-display font-bold text-xl tracking-tight text-Jordyn-light"
                style={{ letterSpacing: '-0.5px' }}
              >
                Jordyn
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-Jordyn-muted hover:text-Jordyn-green transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-Jordyn-muted hover:text-Jordyn-green transition-colors"
              >
                Terms of Service
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-Jordyn-muted">
              © 2026 BotMakers Inc.
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
