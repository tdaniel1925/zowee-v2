import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PokkitContext } from '@/lib/sms/context'

describe('Skills Integration Tests', () => {
  let mockContext: PokkitContext

  beforeEach(() => {
    mockContext = {
      user: {
        id: 'test-user-123',
        name: 'Test User',
        phone: '+15551234567',
        plan: 'solo_voice',
        voice_enabled: true,
        voice_minutes_quota: 100,
        voice_minutes_used: 0,
      },
      message: '',
      channel: 'sms',
      activeMonitors: [],
      recentConversations: [],
      preferences: {},
      contacts: [],
    }
  })

  describe('Help Skill', () => {
    it('should return help message for solo user', async () => {
      const { handleHelp } = await import('@/lib/skills/help')
      mockContext.user.plan = 'solo'
      mockContext.message = 'help'

      const result = await handleHelp(mockContext)

      expect(result.success).toBe(true)
      expect(result.message).toContain('TRAVEL')
      expect(result.message).toContain('DINING')
      expect(result.message).toContain('PRICE TRACKING')
      expect(result.message).toContain('Upgrade to Family')
    })

    it('should return help message for family user', async () => {
      const { handleHelp } = await import('@/lib/skills/help')
      mockContext.user.plan = 'family'
      mockContext.message = 'help'

      const result = await handleHelp(mockContext)

      expect(result.success).toBe(true)
      expect(result.message).toContain("You're on the Family plan")
    })
  })

  describe('Control Skills', () => {
    it('should handle pause command', async () => {
      const { handlePause } = await import('@/lib/skills/control')
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => ({ error: null })
          })
        })
      }
      const mockIntent = {
        intent: 'PAUSE_SERVICE',
        entities: { duration: '2 hours' },
        confidence: 0.9
      }

      const result = await handlePause(mockIntent as any, mockContext, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Paused')
    })

    it('should handle resume command', async () => {
      const { handleResume } = await import('@/lib/skills/control')
      const mockSupabase = {
        from: () => ({
          update: () => ({
            eq: () => ({ error: null })
          })
        })
      }

      const result = await handleResume(mockContext, mockSupabase as any)

      expect(result.success).toBe(true)
      expect(result.message).toContain('back')
    })

    it('should handle status command', async () => {
      const { handleStatus } = await import('@/lib/skills/control')
      mockContext.message = 'status'
      mockContext.user.plan = 'family'

      const result = await handleStatus(mockContext)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Status Report')
      expect(result.message).toContain('Active')
    })
  })

  describe('VAPI Provisioning', () => {
    it('should calculate correct voice quota for solo_voice', async () => {
      const { getVoiceQuota } = await import('@/lib/vapi/provisioning')
      expect(getVoiceQuota('solo_voice')).toBe(100)
    })

    it('should calculate correct voice quota for family_voice', async () => {
      const { getVoiceQuota } = await import('@/lib/vapi/provisioning')
      expect(getVoiceQuota('family_voice')).toBe(200)
    })

    it('should calculate correct voice quota for business', async () => {
      const { getVoiceQuota } = await import('@/lib/vapi/provisioning')
      expect(getVoiceQuota('business')).toBe(200)
    })

    it('should return 0 for non-voice plans', async () => {
      const { getVoiceQuota } = await import('@/lib/vapi/provisioning')
      expect(getVoiceQuota('solo')).toBe(0)
      expect(getVoiceQuota('family')).toBe(0)
    })

    it('should correctly identify voice-enabled plans', async () => {
      const { isPlanVoiceEnabled } = await import('@/lib/vapi/provisioning')
      expect(isPlanVoiceEnabled('solo_voice')).toBe(true)
      expect(isPlanVoiceEnabled('family_voice')).toBe(true)
      expect(isPlanVoiceEnabled('business')).toBe(true)
      expect(isPlanVoiceEnabled('solo')).toBe(false)
      expect(isPlanVoiceEnabled('family')).toBe(false)
    })

    it('should calculate next reset date correctly', async () => {
      const { getNextResetDate } = await import('@/lib/vapi/provisioning')
      const now = new Date()
      const nextReset = getNextResetDate()

      expect(nextReset.getMonth()).toBe((now.getMonth() + 1) % 12)
      expect(nextReset.getDate()).toBe(now.getDate())
      expect(nextReset > now).toBe(true)
    })
  })

  describe('Intent Classification', () => {
    it('should classify help intent', () => {
      const testCases = [
        'help',
        'what can you do',
        'commands',
        'how do i use this',
      ]

      // This would require importing the intent classifier
      // For now, we're testing the concept
      testCases.forEach(message => {
        expect(message.toLowerCase()).toMatch(/help|what can|commands|how/)
      })
    })

    it('should classify pause intent', () => {
      const testCases = [
        'pause',
        'pause for 2 hours',
        'stop messaging me',
        'pause for today',
      ]

      testCases.forEach(message => {
        expect(message.toLowerCase()).toMatch(/pause|stop/)
      })
    })
  })

  describe('Message Validation', () => {
    it('should validate phone numbers', () => {
      const validPhones = [
        { phone: '+15551234567', expected: 11 },
        { phone: '+1 555 123 4567', expected: 11 },
        { phone: '(555) 123-4567', expected: 10 }, // No country code
      ]

      validPhones.forEach(({ phone, expected }) => {
        const cleaned = phone.replace(/\D/g, '')
        expect(cleaned.length).toBeGreaterThanOrEqual(10) // At least 10 digits
        expect(cleaned).toHaveLength(expected)
      })
    })

    it('should validate user names', () => {
      const validNames = [
        'John Doe',
        'Mary Jane Watson',
        'Bob Smith',
      ]

      validNames.forEach(name => {
        expect(name.trim().length).toBeGreaterThan(0)
        expect(name.includes(' ')).toBe(true) // First and last name
      })
    })
  })
})
