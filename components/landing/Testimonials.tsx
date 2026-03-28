import Card from '../ui/Card'

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        'I texted Pokkit to monitor Houston → Miami flights. Three days later I got a text — prices dropped to $134. Booked it in 30 seconds.',
      author: 'Mike T.',
      location: 'Houston, TX',
      rating: 5,
    },
    {
      quote:
        'I sent Pokkit 8 things to research for a client meeting. Got a professional report in my inbox 20 minutes later while I was driving.',
      author: 'Sarah K.',
      location: 'Insurance Agent, Katy TX',
      rating: 5,
    },
    {
      quote:
        'My wife loves that I actually remember our anniversary now. Pokkit texts me a week before every important date. $15 well spent.',
      author: 'David R.',
      location: 'Dallas, TX',
      rating: 5,
    },
  ]

  return (
    <section className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-pokkit-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            Loved by thousands
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <Card key={i} variant="glass" className="flex flex-col">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <span key={j} className="text-pokkit-green text-sm">
                    ★
                  </span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-pokkit-light text-sm leading-relaxed mb-4 flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-pokkit-light font-semibold text-sm">{testimonial.author}</p>
                <p className="text-pokkit-muted text-xs">{testimonial.location}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
