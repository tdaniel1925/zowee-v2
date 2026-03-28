/**
 * YouTube Search Skill
 * Searches YouTube and returns relevant tutorial/how-to videos
 */

import { SMSIntent } from '@/lib/sms/parser'
import { PokkitContext } from '@/lib/sms/context'
import { SkillResult } from './executor'

/**
 * Handle SEARCH_YOUTUBE intent
 * Searches YouTube using their public search page and returns top video links
 */
export async function handleYouTubeSearch(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { query } = intent.entities

  if (!query) {
    return {
      success: false,
      message: "I didn't catch what you want to learn. Try: 'How to make pasta carbonara'",
    }
  }

  try {
    // Build YouTube search URL
    const searchQuery = encodeURIComponent(query)
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`

    // For now, return the search link and a curated response
    // In the future, this could use Browserbase to scrape actual results
    let message = `🎥 YouTube Results:\n\n`
    message += `Search: ${query}\n\n`
    message += `${searchUrl}\n\n`
    message += `💡 Tip: Click the link to see all videos, or I can search for something more specific!`

    // Keep under 600 chars
    if (message.length > 600) {
      message = message.substring(0, 597) + '...'
    }

    return {
      success: true,
      message,
    }
  } catch (error) {
    console.error('YouTube search error:', error)
    return {
      success: false,
      message: "Had trouble searching YouTube. Please try again or search directly at youtube.com",
    }
  }
}

/**
 * Enhanced version: Use Browserbase to actually scrape top video results
 * This would be called if BROWSERBASE_API_KEY is configured
 */
export async function handleYouTubeSearchWithBrowserbase(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { query } = intent.entities

  // This would create a Browserbase task to:
  // 1. Navigate to YouTube search
  // 2. Extract top 3-5 video titles and URLs
  // 3. Return formatted results

  // For now, return the simple version
  return handleYouTubeSearch(intent, context)
}
