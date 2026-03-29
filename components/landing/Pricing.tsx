import Button from '../ui/Button'
import Card from '../ui/Card'

export default function Pricing() {
  const plans = [
    {
      name: 'Solo',
      price: 19,
      period: 'month',
      description: 'Perfect for individuals',
      features: [
        'Book flights, hotels & restaurants',
        'Monitor prices — alert when they drop',
        'Research reports via SMS',
        'Reminders & morning briefings',
        'New skills added every week',
        'Works on any phone — no app ever',
      ],
      cta: 'Start Trial',
      popular: false,
    },
    {
      name: 'Family',
      price: 34,
      period: 'month',
      description: 'Up to 5 family members',
      features: [
        'Everything in Solo',
        'Up to 5 phone numbers',
        'Shared price monitors',
        'Family calendar integration',
        'Group reminders',
        'Priority support',
      ],
      cta: 'Start Trial',
      popular: false,
    },
    {
      name: 'Solo + Voice',
      price: 39,
      period: 'month',
      description: '100 minutes of AI voice calls',
      features: [
        'Everything in Solo',
        '100 minutes/month AI voice agent',
        'Call your Jordyn number',
        'Hands-free assistance',
        'Voice commands & queries',
        'Real-time conversation',
      ],
      cta: 'Start Trial',
      popular: true,
      badge: 'Most Popular',
    },
    {
      name: 'Family + Voice',
      price: 59,
      period: 'month',
      description: '200 minutes for the family',
      features: [
        'Everything in Family',
        '200 minutes/month AI voice agent',
        'Shared across all numbers',
        'Call your Jordyn number',
        'Voice for everyone',
        'Premium support',
      ],
      cta: 'Start Trial',
      popular: false,
    },
    {
      name: 'Business',
      price: 97,
      period: 'month',
      description: 'For teams and businesses',
      features: [
        'Everything in Family + Voice',
        '200 minutes AI voice calls',
        'Email management (coming soon)',
        'Appointment booking (coming soon)',
        'Calendar sync (coming soon)',
        'Team collaboration tools',
        'Dedicated support',
        'Custom integrations',
      ],
      cta: 'Contact Sales',
      popular: false,
      badge: 'Enterprise',
    },
  ]

  return (
    <section className="py-12 relative" id="pricing">
      <div className="max-w-7xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-jordyn-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-jordyn-muted-2">Choose the plan that fits your needs. 7-day free trial on all plans.</p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-3 py-1 rounded-full bg-jordyn-green text-jordyn-dark text-xs font-semibold">
                    {plan.badge}
                  </div>
                </div>
              )}
              <Card
                variant="bordered"
                className={`relative overflow-hidden h-full flex flex-col ${
                  plan.popular ? 'border-jordyn-green/50' : ''
                }`}
              >
                {/* Glow effect for popular */}
                {plan.popular && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      background: 'linear-gradient(90deg, #00E87A, #00C8FF)',
                    }}
                  />
                )}

                <div className={plan.popular ? 'pt-2' : ''}>
                  {/* Plan Name */}
                  <div className="mb-4">
                    <h3 className="font-display font-bold text-xl text-jordyn-light mb-1">{plan.name}</h3>
                    <p className="text-sm text-jordyn-muted-2">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-jordyn-light">${plan.price}</span>
                      <span className="text-jordyn-muted">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-jordyn-green text-sm mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-jordyn-light text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    href={plan.name === 'Business' ? '/contact' : '/signup'}
                    variant={plan.popular ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full"
                  >
                    {plan.cta} →
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-jordyn-muted mb-4">
            All plans include unlimited SMS interactions. No hidden fees. Cancel anytime.
          </p>
          <p className="text-xs text-jordyn-muted-2">
            Voice minutes reset monthly. Overage: $0.50/minute.
          </p>
        </div>
      </div>
    </section>
  )
}
