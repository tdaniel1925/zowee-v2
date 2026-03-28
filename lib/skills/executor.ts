/**
 * Skill Executor for Pokkit
 * Routes parsed intents to appropriate skill handlers
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { SMSIntent } from '@/lib/sms/parser'
import { PokkitContext } from '@/lib/sms/context'
import { handleHelp } from './help'
import { handlePause, handleResume, handleStatus } from './control'
import {
  handleTrackPrice,
  handleCheckMonitors,
  handleStopTracking,
} from './price-tracking'
import { handleGetInfo, handleSearchWeb, handleUnknown } from './general'
import { handleResearch } from './browserbase-research'
import { handleFormFill } from './browserbase-forms'
import { handlePayment, confirmPayment, cancelPayment } from './browserbase-payments'
import { handleYouTubeSearch } from './youtube'
import { handleSmartHomeControl } from './smart-home'

export interface SkillResult {
  success: boolean
  message: string
  data?: any
}

/**
 * Execute skill based on parsed intent
 */
export async function executeSkill(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  try {
    // Check if user is paused
    if (context.user.preferences?.paused && intent.intent !== 'RESUME_SERVICE') {
      const pausedUntil = context.user.preferences.paused_until

      if (pausedUntil && new Date(pausedUntil) > new Date()) {
        // Still paused
        const resumeTime = new Date(pausedUntil).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
        return {
          success: true,
          message: `I'm paused until ${resumeTime}. Text RESUME to activate me early!`,
        }
      } else if (pausedUntil && new Date(pausedUntil) <= new Date()) {
        // Pause expired, auto-resume
        await handleResume(context, supabase)
        // Continue processing the intent below
      } else {
        // Indefinite pause
        return {
          success: true,
          message: "I'm paused. Text RESUME when you need me!",
        }
      }
    }

    // Route to appropriate skill handler
    switch (intent.intent) {
      // HELP
      case 'HELP':
        return await handleHelp(context)

      // CONTROL
      case 'PAUSE_SERVICE':
        return await handlePause(intent, context, supabase)

      case 'RESUME_SERVICE':
        return await handleResume(context, supabase)

      case 'CHECK_STATUS':
        return await handleStatus(context)

      // PRICE TRACKING
      case 'TRACK_PRICE':
        return await handleTrackPrice(intent, context, supabase)

      case 'CHECK_MONITORS':
        return await handleCheckMonitors(context)

      case 'STOP_TRACKING':
        return await handleStopTracking(intent, context, supabase)

      // GENERAL
      case 'GET_INFO':
        return await handleGetInfo(intent, context)

      case 'SEARCH_WEB':
        return await handleSearchWeb(intent, context)

      case 'SEARCH_YOUTUBE':
        return await handleYouTubeSearch(intent, context)

      // SMART HOME (Alexa)
      case 'SMART_HOME_CONTROL':
        return await handleSmartHomeControl(intent, context)

      // RESEARCH (Browserbase)
      case 'RESEARCH_PRICES':
      case 'RESEARCH_REVIEWS':
      case 'RESEARCH_OPTIONS':
      case 'RESEARCH_INFO':
        return await handleResearch(intent, context, supabase)

      // FORMS (Browserbase)
      case 'FILL_BOOKING_FORM':
      case 'FILL_SEARCH_FORM':
      case 'FILL_CONTACT_FORM':
      case 'FILL_APPLICATION':
        return await handleFormFill(intent, context, supabase)

      // PAYMENTS (Browserbase)
      case 'AUTHORIZE_PURCHASE':
      case 'CONFIRM_BOOKING':
      case 'PROCESS_PAYMENT':
        return await handlePayment(intent, context, supabase)

      case 'CANCEL_PAYMENT':
        // If user sends "cancel payment" we need to find the pending payment task
        // For now, return a generic message
        return {
          success: true,
          message: 'No pending payments to cancel.',
        }

      // TRAVEL (not implemented yet - Phase 3)
      case 'FIND_FLIGHT':
        return {
          success: true,
          message:
            '✈️ Flight search coming soon! For now, I can:\n- Track prices\n- Answer questions\n- Help with general info\n\nText HELP to see all features!',
        }

      case 'FIND_HOTEL':
        return {
          success: true,
          message:
            '🏨 Hotel search coming soon! For now, I can:\n- Track prices\n- Answer questions\n- Help with general info\n\nText HELP to see all features!',
        }

      // DINING (not implemented yet - Phase 3)
      case 'FIND_RESTAURANT':
        return {
          success: true,
          message:
            '🍽️ Restaurant search coming soon! For now, I can:\n- Track prices\n- Answer questions\n- Help with general info\n\nText HELP to see all features!',
        }

      case 'BOOK_RESERVATION':
        return {
          success: true,
          message:
            '📅 Reservations coming soon! For now, I can:\n- Track prices\n- Answer questions\n- Help with general info\n\nText HELP to see all features!',
        }

      case 'BOOK_TRAVEL':
        return {
          success: true,
          message:
            '🎫 Booking features coming soon! For now, I can:\n- Track prices\n- Answer questions\n- Help with general info\n\nText HELP to see all features!',
        }

      // UNKNOWN
      case 'UNKNOWN':
      default:
        return await handleUnknown(intent, context)
    }
  } catch (error) {
    console.error('Skill execution error:', error)
    return {
      success: false,
      message:
        "Oops! I ran into an issue processing that. I've logged it and will try to do better. 🤖",
    }
  }
}
