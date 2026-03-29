'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'Does it work with my phone?',
      answer:
        'Yes. Regular text message (SMS) on any phone. No smartphone required. If you can send a text, you can use Jordyn.',
    },
    {
      question: 'What can Jordyn actually do?',
      answer:
        'Book restaurants, flights, and hotels. Monitor prices and alert you when they drop. Research anything and email you a report. Set reminders. Draft and send emails. Answer any question. New skills added every week.',
    },
    {
      question: "What if it can't do something I ask?",
      answer:
        'Jordyn tells you honestly and suggests an alternative. You can also text "I wish you could [thing]" to suggest a new skill.',
    },
    {
      question: 'Is my information secure?',
      answer:
        'Yes. We never store passwords. Connections use secure authentication. Your data is encrypted and never sold or shared.',
    },
    {
      question: 'How do I cancel?',
      answer: 'Text CANCEL to your Jordyn number. Done. No forms, no phone calls, no hassle.',
    },
  ]

  return (
    <section className="py-12 relative" id="faq">
      <div className="max-w-3xl mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2
            className="font-display font-bold text-jordyn-light mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-1px' }}
          >
            Questions?
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-large border border-white/10 overflow-hidden transition-all"
              style={{
                background: openIndex === i ? 'rgba(0,232,122,0.03)' : 'rgba(255,255,255,0.02)',
                borderColor: openIndex === i ? 'rgba(0,232,122,0.2)' : 'rgba(255,255,255,0.1)',
              }}
            >
              {/* Question */}
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-display font-semibold text-jordyn-light pr-8">
                  {faq.question}
                </span>
                <span
                  className="text-jordyn-green text-2xl transition-transform flex-shrink-0"
                  style={{
                    transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>

              {/* Answer */}
              <div
                className="overflow-hidden transition-all"
                style={{
                  maxHeight: openIndex === i ? '500px' : '0',
                }}
              >
                <div className="px-6 pb-4 text-jordyn-muted-2 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
