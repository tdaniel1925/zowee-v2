import Card from '../ui/Card'

export default function RealExamples() {
  const examples = [
    {
      title: 'Flight Monitor',
      messages: [
        { type: 'user', text: 'Monitor Houston → Miami flights under $200' },
        { type: 'pokkit', text: '👀 Watching Houston → Miami\nI\'ll alert you when prices drop below $200' },
        { type: 'pokkit', text: '🎯 Price drop! United $178 non-stop\nBook now?' },
      ],
    },
    {
      title: 'Restaurant Booking',
      messages: [
        { type: 'user', text: 'Book Uchi tonight 8pm for 2' },
        { type: 'pokkit', text: 'Checking Uchi availability...' },
        { type: 'pokkit', text: '✅ Reserved! 8pm, table for 2\nConfirmation #UC482' },
      ],
    },
    {
      title: 'Research Report',
      messages: [
        { type: 'user', text: 'Research best SUVs under $40k with good safety ratings' },
        { type: 'pokkit', text: '📊 Researching now...' },
        { type: 'pokkit', text: 'Report emailed!\nTop 5 SUVs with specs, pricing, and safety scores' },
      ],
    },
    {
      title: 'Price Drop Alert',
      messages: [
        { type: 'user', text: 'Track Sony WH-1000XM5, alert under $280' },
        { type: 'pokkit', text: '✓ Tracking Sony WH-1000XM5' },
        { type: 'pokkit', text: '🔔 Price drop! Now $268 on Amazon\nLink: amzn.to/xyz' },
      ],
    },
    {
      title: 'Morning Briefing',
      messages: [
        { type: 'pokkit', text: '☀️ Good morning!\n\n📅 Today: Team meeting 2pm\n🌤️ Weather: 75°F, sunny\n✈️ Your NYC flight prices: Still $340+' },
        { type: 'user', text: 'Thanks!' },
      ],
    },
    {
      title: 'Step by Step Help',
      messages: [
        { type: 'user', text: 'How do I file a noise complaint in Austin?' },
        { type: 'pokkit', text: '1. Call 311 or use the Austin 311 app\n2. Provide address & time\n3. Case # will be issued\n\nWant me to find the phone number?' },
      ],
    },
  ]

  return (
    <section className="py-12 relative" id="examples">
      <div className="max-w-6xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-pokkit-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            See it in action
          </h2>
          <p className="text-lg text-pokkit-muted-2">Real conversations. Real results.</p>
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example, i) => (
            <Card key={i} variant="glass" className="hover:border-pokkit-green/30 transition-all">
              <h3 className="font-display font-semibold text-pokkit-light mb-4 text-sm">
                {example.title}
              </h3>

              <div className="space-y-3">
                {example.messages.map((msg, j) => (
                  <div
                    key={j}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-lg text-xs max-w-[85%]`}
                      style={{
                        background: msg.type === 'user' ? '#00E87A' : 'rgba(255,255,255,0.06)',
                        color: msg.type === 'user' ? '#0A0A0F' : 'rgba(232,232,240,0.9)',
                        fontWeight: msg.type === 'user' ? 600 : 400,
                      }}
                    >
                      {msg.text.split('\n').map((line, k) => (
                        <p key={k} className={k > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
