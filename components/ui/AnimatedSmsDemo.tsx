'use client'

import { useEffect, useState } from 'react'

interface Message {
  type: 'user' | 'pokkit'
  text: string
  highlight?: boolean
}

interface Scenario {
  messages: Message[]
}

const scenarios: Scenario[] = [
  {
    messages: [
      { type: 'user', text: 'Book me a flight NYC → LA next Friday, under $300' },
      {
        type: 'pokkit',
        text: 'Found 3 options ✈️\nBest: JetBlue 8:20am · $247\nReply BOOK to confirm',
      },
      { type: 'user', text: 'BOOK' },
      { type: 'pokkit', text: '✅ Booked! Confirmation sent to your email.' },
    ],
  },
  {
    messages: [
      { type: 'user', text: 'Track AirPods Pro price, alert me under $180' },
      {
        type: 'pokkit',
        text: '👀 Tracking AirPods Pro\nCurrent: $249 · I\'ll text you when it drops',
      },
      {
        type: 'pokkit',
        text: '🔔 Price drop alert!\nAirPods Pro now $169 on Amazon\nReply BUY to order now',
        highlight: true,
      },
    ],
  },
  {
    messages: [
      { type: 'user', text: 'Best Italian restaurant in SoHo, open tonight, under $50pp' },
      {
        type: 'pokkit',
        text: '🍝 Top pick: Lupa Osteria\n⭐ 4.7 · $40pp avg · Open til 11pm\nTables available at 7pm & 8:30pm',
      },
      { type: 'user', text: 'Book 8:30 for 2' },
      { type: 'pokkit', text: '✅ Reserved! 8:30pm, 2 guests. See you there 🎉' },
    ],
  },
]

export default function AnimatedSmsDemo() {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    let messageIndex = 0
    const scenario = scenarios[currentScenario]
    setVisibleMessages([])

    const showNextMessage = () => {
      if (messageIndex >= scenario.messages.length) {
        // Wait before cycling to next scenario
        setTimeout(() => {
          setCurrentScenario((prev) => (prev + 1) % scenarios.length)
        }, 3000)
        return
      }

      const message = scenario.messages[messageIndex]

      // Show typing indicator for Pokkit messages
      if (message.type === 'pokkit') {
        setShowTyping(true)
        setTimeout(() => {
          setShowTyping(false)
          setVisibleMessages((prev) => [...prev, message])
          messageIndex++
          setTimeout(showNextMessage, 1500)
        }, 1000)
      } else {
        setVisibleMessages((prev) => [...prev, message])
        messageIndex++
        setTimeout(showNextMessage, 800)
      }
    }

    const timer = setTimeout(showNextMessage, 500)
    return () => clearTimeout(timer)
  }, [currentScenario])

  return (
    <div className="relative">
      {/* Phone outer glow */}
      <div
        className="absolute inset-0 rounded-large opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,232,122,0.3) 0%, transparent 70%)',
          filter: 'blur(30px)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Phone Frame */}
      <div
        className="phone-frame relative rounded-large overflow-hidden"
        style={{
          width: '280px',
          height: '560px',
          borderRadius: '36px',
          background: '#0A0A0F',
          border: '12px solid #1A1A24',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Phone notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
          style={{
            width: '100px',
            height: '28px',
            background: '#0A0A0F',
            borderRadius: '0 0 18px 18px',
          }}
        />

        {/* Phone screen */}
        <div
          className="h-full flex flex-col"
          style={{
            paddingTop: '36px',
            background: 'linear-gradient(180deg, #111118 0%, #0A0A0F 100%)',
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pb-2" style={{ paddingTop: '4px' }}>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
              9:41
            </span>
            <div className="flex items-center gap-1">
              <div
                style={{
                  width: '14px',
                  height: '7px',
                  border: '1.5px solid rgba(255,255,255,0.5)',
                  borderRadius: '2px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '1px',
                    top: '1px',
                    bottom: '1px',
                    width: '70%',
                    background: '#00E87A',
                    borderRadius: '1px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SMS Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00E87A, #00C8FF)' }}
            >
              <span className="font-display font-bold text-sm" style={{ color: '#0A0A0F' }}>
                Z
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#E8E8F0', fontSize: '13px' }}>
                Pokkit
              </p>
              <div className="flex items-center gap-1">
                <div
                  className="rounded-full"
                  style={{ width: '5px', height: '5px', background: '#00E87A' }}
                />
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Always on</p>
              </div>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>SMS</span>
          </div>

          {/* SMS Conversation Area */}
          <div className="flex-1 px-3 py-4 overflow-hidden">
            {visibleMessages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-3 animate-slideIn`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-[200px]`}
                  style={{
                    background:
                      message.type === 'user'
                        ? '#00E87A'
                        : message.highlight
                        ? 'rgba(0,232,122,0.1)'
                        : 'rgba(255,255,255,0.08)',
                    borderColor: message.highlight ? 'rgba(0,232,122,0.3)' : 'transparent',
                    border: message.highlight ? '1px solid' : 'none',
                  }}
                >
                  <p
                    className="text-xs whitespace-pre-line"
                    style={{
                      color: message.type === 'user' ? '#0A0A0F' : message.highlight ? '#00E87A' : 'rgba(232,232,240,0.9)',
                      fontWeight: message.type === 'user' ? 600 : 400,
                    }}
                  >
                    {message.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <div className="flex justify-start mb-2">
                <div
                  className="flex items-center gap-1 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-3 pb-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-xs flex-1" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                Text Pokkit anything...
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#00E87A' }}
              >
                <span style={{ fontSize: '10px', color: '#0A0A0F', fontWeight: 700 }}>↑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario indicators */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {scenarios.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentScenario ? 'bg-jordyn-green w-6' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
