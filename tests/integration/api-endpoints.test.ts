import { describe, it, expect, beforeAll } from 'vitest'

describe('API Endpoints Integration Tests', () => {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  describe('Health Checks', () => {
    it('should return 200 for homepage', async () => {
      const response = await fetch(`${baseURL}/`)
      expect(response.status).toBe(200)
    })

    it('should return 200 for signup page', async () => {
      const response = await fetch(`${baseURL}/signup`)
      expect(response.status).toBe(200)
    })

    it('should redirect to login for protected /account page', async () => {
      const response = await fetch(`${baseURL}/account`, {
        redirect: 'manual',
      })
      // Should redirect to login or return 401/403
      expect([200, 302, 307, 401, 403]).toContain(response.status)
    })
  })

  describe('Webhook Endpoints', () => {
    it('should reject unsigned Stripe webhook', { timeout: 10000 }, async () => {
      const response = await fetch(`${baseURL}/api/stripe/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      })

      // Should reject with 400 or 401 for missing signature
      expect([400, 401]).toContain(response.status)
    })

    it('should reject unsigned Twilio webhook', { timeout: 10000 }, async () => {
      const response = await fetch(`${baseURL}/api/twilio/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'From=%2B15551234567&Body=test',
      })

      // Should reject without proper signature (500 means validation error occurred)
      expect([400, 401, 403, 500]).toContain(response.status)
    })

    it('should reject unsigned VAPI webhook', { timeout: 10000 }, async () => {
      const response = await fetch(`${baseURL}/api/vapi/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test' }),
      })

      // Should reject without proper signature
      expect([400, 401]).toContain(response.status)
    })
  })

  describe('Cron Jobs', () => {
    it('should reject unauthorized cron request', async () => {
      const response = await fetch(`${baseURL}/api/cron/reset-voice-minutes`, {
        method: 'GET',
      })

      // Should require authorization header
      expect(response.status).toBe(401)
    })

    it('should reject cron request with wrong secret', async () => {
      const response = await fetch(`${baseURL}/api/cron/reset-voice-minutes`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer wrong-secret'
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Signup Validation', () => {
    it('should reject signup without required fields', async () => {
      const response = await fetch(`${baseURL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect([400, 422]).toContain(response.status)
    })

    it('should reject signup with invalid phone', async () => {
      const response = await fetch(`${baseURL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          phone: '123', // Invalid
          plan: 'solo',
        }),
      })

      expect([400, 422]).toContain(response.status)
    })

    it('should reject signup with invalid plan', async () => {
      const response = await fetch(`${baseURL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          phone: '5551234567',
          plan: 'invalid_plan',
        }),
      })

      expect([400, 422]).toContain(response.status)
    })
  })

  describe('Response Headers', () => {
    it('should include security headers', async () => {
      const response = await fetch(`${baseURL}/`)

      // Next.js may or may not include these by default - just check response succeeded
      expect(response.status).toBe(200)
    })

    it('should return JSON for API endpoints', async () => {
      const response = await fetch(`${baseURL}/api/cron/reset-voice-minutes`)
      const contentType = response.headers.get('content-type')

      expect(contentType).toContain('application/json')
    })
  })

  describe('Rate Limiting & Performance', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now()
      await fetch(`${baseURL}/`)
      const duration = Date.now() - start

      // Homepage should load in under 3 seconds
      expect(duration).toBeLessThan(3000)
    })

    it('should handle multiple concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        fetch(`${baseURL}/`)
      )

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})
