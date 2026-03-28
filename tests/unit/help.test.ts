import { describe, it, expect } from 'vitest'
import { handleHelp } from '@/lib/skills/help'
import { PokkitContext } from '@/lib/sms/context'

describe('Help Skill', () => {
  it('should return help message with user name', async () => {
    const context: PokkitContext = {
      user: {
        id: 'test-user',
        name: 'John Doe',
        phone: '+15551234567',
        plan: 'solo',
      },
      message: 'help',
      channel: 'sms',
      activeMonitors: [],
      recentConversations: [],
      preferences: {},
      contacts: [],
    }

    const result = await handleHelp(context)

    expect(result.success).toBe(true)
    expect(result.message).toContain('Hi John!')
    expect(result.message).toContain('TRAVEL')
    expect(result.message).toContain('DINING')
    expect(result.message).toContain('PRICE TRACKING')
    expect(result.message).toContain('SMART HOME')
    expect(result.message).toContain('Alexa')
  })

  it('should show upgrade message for solo plan', async () => {
    const context: PokkitContext = {
      user: {
        id: 'test-user',
        name: 'Jane Smith',
        phone: '+15551234567',
        plan: 'solo',
      },
      message: 'help',
      channel: 'sms',
      activeMonitors: [],
      recentConversations: [],
      preferences: {},
      contacts: [],
    }

    const result = await handleHelp(context)

    expect(result.message).toContain('Upgrade to Family')
  })

  it('should show success message for family plan', async () => {
    const context: PokkitContext = {
      user: {
        id: 'test-user',
        name: 'Jane Smith',
        phone: '+15551234567',
        plan: 'family',
      },
      message: 'help',
      channel: 'sms',
      activeMonitors: [],
      recentConversations: [],
      preferences: {},
      contacts: [],
    }

    const result = await handleHelp(context)

    expect(result.message).toContain("You're on the Family plan")
  })
})
