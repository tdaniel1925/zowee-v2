import Link from 'next/link'
import Button from '../ui/Button'

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
      style={{
        background: 'rgba(10,10,15,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '60px',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-small flex items-center justify-center"
              style={{ background: '#00E87A' }}
            >
              <span
                className="font-display font-800 text-xs"
                style={{ color: '#0A0A0F', fontSize: '11px', fontWeight: 800, letterSpacing: '-0.5px' }}
              >
                J
              </span>
            </div>
            <span
              className="font-display font-bold text-xl tracking-tight text-jordyn-light"
              style={{ letterSpacing: '-0.5px' }}
            >
              JORDYN
            </span>
          </div>
        </Link>

        {/* Nav Links (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-sm text-jordyn-muted hover:text-jordyn-light transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-sm text-jordyn-muted hover:text-jordyn-light transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm text-jordyn-muted hover:text-jordyn-light transition-colors"
          >
            FAQ
          </a>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full animate-green-pulse"
              style={{ background: '#00E87A' }}
            />
            <span className="text-xs font-medium text-jordyn-muted">Live</span>
          </div>
          <Button href="/signup" size="sm">
            Try Free
          </Button>
        </div>
      </div>
    </header>
  )
}
