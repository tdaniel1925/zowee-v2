'use client'

/**
 * Telnyx Voice AI Sales Widget
 * Embedded chat/voice widget for pre-sales support
 */

import { useEffect } from 'react'
import Script from 'next/script'

interface SalesWidgetProps {
  assistantId: string
}

export default function SalesWidget({ assistantId }: SalesWidgetProps) {
  useEffect(() => {
    // Initialize widget when Telnyx script loads
    const initWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TelnyxWidget) {
        (window as any).TelnyxWidget.init({
          assistantId: assistantId,
          position: 'bottom-right',
          theme: {
            primaryColor: '#00E5B4', // Pokkit teal-green
            backgroundColor: '#1a1a1a',
            textColor: '#ffffff',
            buttonColor: '#00E5B4',
          },
          greeting: "👋 Hi! I'm here to help you learn about Pokkit. Ask me anything!",
          placeholder: 'Ask about plans, features, pricing...',
          welcomeMessage: "Hi there! 👋\n\nI'm the Pokkit sales assistant. I can help you understand:\n\n• How Pokkit works\n• Pricing and plans\n• Features and capabilities\n• The free trial\n\nFeel free to ask me anything, or click the microphone to talk!",
        })
      }
    }

    // Try to initialize if script is already loaded
    initWidget()

    // Set up event listener for when script loads
    window.addEventListener('telnyxWidgetLoaded', initWidget)

    return () => {
      window.removeEventListener('telnyxWidgetLoaded', initWidget)
    }
  }, [assistantId])

  return (
    <>
      {/* Load Telnyx Widget Script */}
      <Script
        src="https://widget.telnyx.com/ai-assistant.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Dispatch custom event when loaded
          window.dispatchEvent(new Event('telnyxWidgetLoaded'))
        }}
      />
    </>
  )
}
