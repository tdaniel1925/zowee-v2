'use client'

/**
 * Hero Section Inline Chat Widget
 * Stationary chat interface embedded in hero section
 * Uses Claude API for demo conversations
 */

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function HeroChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm Jordyn's AI assistant. Ask me anything about our service - pricing, features, how it works, or try me out with a real question!",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: 'hero_demo',
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I had trouble understanding that. Can you rephrase?',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Try again in a moment!",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-black border border-jordyn-green/20 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-jordyn-green/10 border-b border-jordyn-green/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-jordyn-green rounded-full animate-pulse" />
          <div>
            <h3 className="text-white font-semibold text-lg">Try Jordyn Now</h3>
            <p className="text-jordyn-light/60 text-sm">Ask me anything - I'm your demo AI assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="h-96 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-jordyn-green/20 scrollbar-track-transparent"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-jordyn-green text-black font-medium'
                  : 'bg-gray-800 text-jordyn-light border border-gray-700'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-jordyn-light border border-gray-700 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-jordyn-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-jordyn-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-jordyn-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-jordyn-green/20 p-4 bg-black/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about pricing, features, or try a command..."
            className="flex-1 bg-gray-900 text-jordyn-light border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-jordyn-green transition-colors placeholder:text-jordyn-light/40"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-jordyn-green text-black rounded-xl hover:bg-jordyn-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-jordyn-light/40 text-xs mt-2 text-center">
          Try: "How much does it cost?" or "How do I sign up?"
        </p>
      </div>
    </div>
  )
}
