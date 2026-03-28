export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      emoji: '💬',
      title: 'Text anything',
      description: 'No app. No login. Just text your Zowee number like any contact.',
    },
    {
      number: '2',
      emoji: '🤖',
      title: 'Zowee handles it',
      description:
        'Books, researches, monitors, reminds — using the same services you&apos;d use yourself, but faster.',
    },
    {
      number: '3',
      emoji: '✅',
      title: 'Get results',
      description: 'Confirmation texts, email reports, price alerts — delivered to you.',
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-zowee-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            How it works
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connecting line (desktop only) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-zowee-green/30 to-transparent"
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}

              <div className="relative bg-zowee-dark-2/50 backdrop-blur-sm rounded-large p-6 border border-white/10 hover:border-zowee-green/30 transition-colors">
                {/* Step number */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,232,122,0.2), rgba(0,200,255,0.1))',
                    border: '2px solid rgba(0,232,122,0.3)',
                  }}
                >
                  <span className="text-2xl">{step.emoji}</span>
                </div>

                <h3 className="font-display font-bold text-xl text-zowee-light mb-2 text-center md:text-left">
                  {step.title}
                </h3>
                <p className="text-zowee-muted-2 text-sm leading-relaxed text-center md:text-left">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-zowee-muted-2 text-sm max-w-2xl mx-auto">
            Works on any phone. Your parents&apos; phone. Your old flip phone.{' '}
            <span className="text-zowee-green font-semibold">Any phone.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
