'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentMethodsPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  )
}

function PaymentMethodsContent() {
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods')
      const data = await res.json()
      setPaymentMethods(data.payment_methods || [])
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm('Remove this payment method?')) return

    try {
      await fetch('/api/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      })

      await loadPaymentMethods()
    } catch (error) {
      console.error('Error removing payment method:', error)
      alert('Failed to remove payment method')
    }
  }

  return (
    <>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-[60px]"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-pokkit-green">
              <span className="font-heading font-extrabold text-pokkit-dark text-[11px] tracking-tight">
                Z
              </span>
            </div>
            <Link
              href="/account"
              className="font-heading font-bold text-xl text-pokkit-light tracking-tight no-underline"
            >
              POKKIT
            </Link>
          </div>
          <Link
            href="/account"
            className="text-sm font-medium text-pokkit-light/60 hover:text-pokkit-light transition-colors no-underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-pokkit-dark pt-[60px]">
        <div className="max-w-3xl mx-auto px-4 relative z-10 py-12">
          <h1 className="font-heading font-bold text-2xl text-pokkit-light tracking-tight mb-2">
            Payment Methods
          </h1>
          <p className="text-sm text-pokkit-light/45 mb-8">
            Manage saved payment methods for automated purchases
          </p>

          {/* Saved Cards */}
          {loading ? (
            <div className="rounded-2xl p-6 bg-white/2 border border-white/5 text-center">
              <p className="text-sm text-pokkit-light/50">Loading...</p>
            </div>
          ) : paymentMethods.length === 0 && !showAddForm ? (
            <div className="rounded-2xl p-8 bg-white/2 border border-white/5 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-pokkit-green/10 border border-pokkit-green/20">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="font-heading font-bold text-lg text-pokkit-light mb-2">
                No payment methods
              </h3>
              <p className="text-sm text-pokkit-light/50 mb-6">
                Add a payment method to enable automated purchases
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 rounded-lg text-sm font-bold bg-pokkit-green/15 border border-pokkit-green/30 text-pokkit-green hover:bg-pokkit-green/20 transition-all"
              >
                Add Payment Method
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="rounded-2xl px-5 py-4 bg-white/2 border border-white/5 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-pokkit-green/10 border border-pokkit-green/20">
                      <span className="text-xl">💳</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-pokkit-light capitalize">
                        {pm.brand} •••• {pm.last4}
                      </p>
                      <p className="text-xs text-pokkit-light/40 mt-0.5">
                        Expires {pm.exp_month}/{pm.exp_year}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(pm.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-pokkit-light/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 rounded-lg text-sm font-semibold bg-white/5 border border-white/10 text-pokkit-light/70 hover:bg-white/10 transition-all"
                >
                  + Add Another Card
                </button>
              )}
            </>
          )}

          {/* Add Card Form */}
          {showAddForm && (
            <div className="rounded-2xl p-6 bg-white/3 border border-white/8">
              <h3 className="font-heading font-bold text-lg text-pokkit-light mb-4">
                Add Payment Method
              </h3>
              <AddCardForm
                onSuccess={() => {
                  setShowAddForm(false)
                  loadPaymentMethods()
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Info */}
          <div className="mt-8 rounded-2xl p-5 bg-blue-500/5 border border-blue-500/15">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-500/25">
                <span className="text-base">🔒</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-pokkit-light/85 mb-1">
                  Secure Payment Processing
                </p>
                <p className="text-xs text-pokkit-light/55 leading-relaxed">
                  Your payment information is securely stored and tokenized by Stripe. Pokkit never
                  stores your raw card data. All transactions require your explicit confirmation via
                  SMS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function AddCardForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment method
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (stripeError) {
        setError(stripeError.message || 'Failed to create payment method')
        setLoading(false)
        return
      }

      // Save to Pokkit
      const res = await fetch('/api/payment-methods/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethod.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to save payment method')
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error adding card:', err)
      setError(err.message || 'Failed to add payment method')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-pokkit-light/70 mb-2">
          Card Information
        </label>
        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#E0E0E5',
                  '::placeholder': {
                    color: '#6B6B75',
                  },
                },
                invalid: {
                  color: '#ff4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/5 border border-white/10 text-pokkit-light/70 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-pokkit-green/15 border border-pokkit-green/30 text-pokkit-green hover:bg-pokkit-green/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Card'}
        </button>
      </div>
    </form>
  )
}
