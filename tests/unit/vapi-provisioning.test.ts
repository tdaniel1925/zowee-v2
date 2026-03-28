import { describe, it, expect } from 'vitest'
import { getVoiceQuota, isPlanVoiceEnabled, getNextResetDate } from '@/lib/vapi/provisioning'

describe('VAPI Provisioning', () => {
  describe('getVoiceQuota', () => {
    it('should return 100 for solo_voice', () => {
      expect(getVoiceQuota('solo_voice')).toBe(100)
    })

    it('should return 200 for family_voice', () => {
      expect(getVoiceQuota('family_voice')).toBe(200)
    })

    it('should return 200 for business', () => {
      expect(getVoiceQuota('business')).toBe(200)
    })

    it('should return 0 for solo', () => {
      expect(getVoiceQuota('solo')).toBe(0)
    })

    it('should return 0 for family', () => {
      expect(getVoiceQuota('family')).toBe(0)
    })
  })

  describe('isPlanVoiceEnabled', () => {
    it('should return true for voice plans', () => {
      expect(isPlanVoiceEnabled('solo_voice')).toBe(true)
      expect(isPlanVoiceEnabled('family_voice')).toBe(true)
      expect(isPlanVoiceEnabled('business')).toBe(true)
    })

    it('should return false for non-voice plans', () => {
      expect(isPlanVoiceEnabled('solo')).toBe(false)
      expect(isPlanVoiceEnabled('family')).toBe(false)
    })
  })

  describe('getNextResetDate', () => {
    it('should return date 1 month in future', () => {
      const now = new Date()
      const nextReset = getNextResetDate()

      expect(nextReset.getMonth()).toBe((now.getMonth() + 1) % 12)
      expect(nextReset.getDate()).toBe(now.getDate())
    })
  })
})
