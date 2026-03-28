/**
 * Help Skill - Show user what Pokkit can do
 */

import { PokkitContext } from '@/lib/sms/context'

export interface SkillResult {
  success: boolean
  message: string
  data?: any
}

export async function handleHelp(context: PokkitContext): Promise<SkillResult> {
  const { user } = context

  let message = `Hi ${user.name.split(' ')[0]}! 👋\n\n`
  message += `I'm Pokkit, your personal AI assistant. Here's what I can do:\n\n`

  message += `🛫 TRAVEL\n`
  message += `"Find flights to NYC next Friday"\n`
  message += `"Find hotels in Austin under $150/night"\n\n`

  message += `🍽️ DINING\n`
  message += `"Find sushi near me tonight at 7pm"\n`
  message += `"Book a table for 4 at Nobu"\n\n`

  message += `📊 PRICE TRACKING\n`
  message += `"Track PS5 prices under $450"\n`
  message += `"Check my price alerts"\n`
  message += `"Stop tracking PS5"\n\n`

  message += `💬 GENERAL\n`
  message += `"What's the weather in Dallas?"\n`
  message += `"How to make pasta carbonara"\n\n`

  message += `🏠 SMART HOME\n`
  message += `"Turn off living room lights"\n`
  message += `"Set thermostat to 72"\n\n`

  message += `⚙️ CONTROLS\n`
  message += `"Pause for 2 hours"\n`
  message += `"Resume"\n`
  message += `"Status"\n\n`

  if (user.plan === 'solo') {
    message += `💎 Upgrade to Family ($24/mo) for priority support & advanced features!`
  } else {
    message += `💎 You're on the Family plan - you have access to all features!`
  }

  return {
    success: true,
    message,
  }
}
