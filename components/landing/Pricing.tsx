import Button from '../ui/Button'
import Card from '../ui/Card'

export default function Pricing() {
  const features = [
    'Book flights, hotels & restaurants',
    'Monitor prices — alert when they drop',
    'Research reports emailed to you',
    'Reminders & morning briefings',
    'Email drafting & sending',
    'New skills added every week',
    'Works on any phone — no app ever',
  ]

  return (
    <section className="py-24 relative" id="pricing">
      <div className="max-w-4xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-zowee-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            Simple pricing
          </h2>
          <p className="text-lg text-zowee-muted-2">Everything. Unlimited. No hidden fees.</p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <Card variant="bordered" className="relative overflow-hidden">
            {/* Glow effect */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: 'linear-gradient(90deg, #00E87A, #00C8FF)',
              }}
            />

            <div className="text-center mb-6 pt-2">
              <div className="inline-flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-display font-bold text-zowee-light">$15</span>
                <span className="text-zowee-muted text-lg">/ month</span>
              </div>
              <p className="text-zowee-muted-2 text-sm">Everything. Unlimited.</p>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-8">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-zowee-green text-lg mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-zowee-light text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button href="/signup" variant="primary" size="lg" className="w-full mb-4">
              Start Free — 2 Weeks on Us →
            </Button>

            <p className="text-center text-xs text-zowee-muted">
              No charge for 14 days. Cancel anytime by texting CANCEL.
            </p>
          </Card>

          {/* Family Plan Note */}
          <div className="mt-8 text-center">
            <div
              className="inline-block px-4 py-3 rounded-large border"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <p className="text-sm text-zowee-muted-2">
                <span className="font-semibold text-zowee-light">Family plan:</span> $24/month for up to 6 numbers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
