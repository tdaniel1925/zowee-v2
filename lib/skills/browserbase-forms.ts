/**
 * Browserbase Form Filling Skills
 * Handles form filling tasks (bookings, searches, contact forms, applications)
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { SMSIntent } from '@/lib/sms/parser'
import { PokkitContext } from '@/lib/sms/context'
import { createBrowserTask, loadUserProfile } from '@/lib/browserbase/session'
import { SkillResult } from './executor'

/**
 * Handle all form-filling intents
 */
export async function handleFormFill(
  intent: SMSIntent,
  context: PokkitContext,
  supabase: SupabaseClient<any>
): Promise<SkillResult> {
  const { form_type, site, data } = intent.entities

  // Load user profile for form filling
  const profile = await loadUserProfile(context.user.id, supabase)

  // Check if user has required info
  if (!profile.name || !profile.email) {
    return {
      success: false,
      message: `I need your profile info to fill forms. Visit ${process.env.NEXT_PUBLIC_APP_URL}/account/settings to add your details.`,
    }
  }

  // Build instructions
  const instructions = buildFormInstructions(intent, profile)

  // Create browser task
  try {
    const task = await createBrowserTask(
      {
        user_id: context.user.id,
        task_type: 'form_fill',
        intent,
        instructions,
      },
      supabase
    )

    // Build response message based on form type
    let message = '📝 '

    if (form_type === 'booking' || intent.intent === 'FILL_BOOKING_FORM') {
      message += 'Filling out booking form...'
    } else if (form_type === 'search' || intent.intent === 'FILL_SEARCH_FORM') {
      message += 'Running search...'
    } else if (form_type === 'contact' || intent.intent === 'FILL_CONTACT_FORM') {
      message += 'Filling contact form...'
    } else {
      message += 'Filling form...'
    }

    message += " I'll confirm when done!"

    return {
      success: true,
      message,
      data: { task_id: task.id },
    }
  } catch (error) {
    console.error('Error creating form fill task:', error)
    return {
      success: false,
      message: "Sorry, I couldn't start the form fill task. Please try again.",
    }
  }
}

/**
 * Build form filling instructions for Claude Computer Use
 */
function buildFormInstructions(intent: SMSIntent, profile: any): string {
  const { form_type, site, data, url } = intent.entities

  let instructions = 'Form Filling Task:\n\n'

  // Site/URL
  if (url || site) {
    instructions += `Website: ${url || site}\n\n`
  }

  // User profile data
  instructions += `User Profile:\n`
  instructions += `- Name: ${profile.name}\n`
  instructions += `- Email: ${profile.email}\n`
  instructions += `- Phone: ${profile.phone || 'Not provided'}\n`

  if (profile.preferences) {
    instructions += `- Preferences: ${JSON.stringify(profile.preferences)}\n`
  }

  instructions += `\n`

  // Task-specific instructions
  if (intent.intent === 'FILL_BOOKING_FORM' || form_type === 'booking') {
    instructions += `Task: Fill out booking/reservation form\n\n`
    instructions += `Form Data:\n`
    if (data.restaurant) instructions += `- Restaurant: ${data.restaurant}\n`
    if (data.party_size) instructions += `- Party Size: ${data.party_size}\n`
    if (data.date) instructions += `- Date: ${data.date}\n`
    if (data.time) instructions += `- Time: ${data.time}\n`
    if (data.special_requests) instructions += `- Special Requests: ${data.special_requests}\n`

    instructions += `\nSteps:\n`
    instructions += `1. Navigate to the booking page\n`
    instructions += `2. Fill out all required fields using the data above\n`
    instructions += `3. DO NOT submit the form unless explicitly told to\n`
    instructions += `4. Take a screenshot of the filled form\n`
    instructions += `5. Return confirmation and next steps\n\n`
  } else if (intent.intent === 'FILL_SEARCH_FORM' || form_type === 'search') {
    instructions += `Task: Fill and submit search form\n\n`
    instructions += `Search Parameters:\n`
    if (data.origin) instructions += `- Origin: ${data.origin}\n`
    if (data.destination) instructions += `- Destination: ${data.destination}\n`
    if (data.departure_date) instructions += `- Departure: ${data.departure_date}\n`
    if (data.return_date) instructions += `- Return: ${data.return_date}\n`
    if (data.passengers) instructions += `- Passengers: ${data.passengers}\n`
    if (data.check_in) instructions += `- Check-in: ${data.check_in}\n`
    if (data.check_out) instructions += `- Check-out: ${data.check_out}\n`
    if (data.rooms) instructions += `- Rooms: ${data.rooms}\n`
    if (data.guests) instructions += `- Guests: ${data.guests}\n`

    instructions += `\nSteps:\n`
    instructions += `1. Navigate to the search page\n`
    instructions += `2. Fill out search form with parameters above\n`
    instructions += `3. Submit the search\n`
    instructions += `4. Extract top 5-10 results with prices and details\n`
    instructions += `5. Return structured data\n\n`
  } else if (intent.intent === 'FILL_CONTACT_FORM' || form_type === 'contact') {
    instructions += `Task: Fill out contact form\n\n`
    instructions += `Message: ${data.message || data.subject || 'Contact inquiry'}\n\n`
    instructions += `Steps:\n`
    instructions += `1. Navigate to contact page\n`
    instructions += `2. Fill out name, email, phone\n`
    instructions += `3. Enter message/subject\n`
    instructions += `4. Submit form\n`
    instructions += `5. Return confirmation\n\n`
  } else {
    // Generic form
    instructions += `Task: Fill out form\n\n`
    instructions += `Form Data: ${JSON.stringify(data)}\n\n`
    instructions += `Steps:\n`
    instructions += `1. Navigate to form\n`
    instructions += `2. Fill fields matching the data above\n`
    instructions += `3. Use user profile data for personal info\n`
    instructions += `4. Take screenshot\n`
    instructions += `5. Return result\n\n`
  }

  instructions += `Output Format:\n`
  instructions += `Return JSON:\n`
  instructions += `{\n`
  instructions += `  "success": true,\n`
  instructions += `  "form_url": "URL of form",\n`
  instructions += `  "fields_filled": { field_name: value },\n`
  instructions += `  "submitted": true/false,\n`
  instructions += `  "confirmation_message": "Message from site if submitted",\n`
  instructions += `  "next_steps": "What user should do next"\n`
  instructions += `}\n`

  return instructions
}

/**
 * Format form fill results for SMS
 */
export function formatFormResults(task: any): string {
  const result = task.result

  if (!result) {
    return '❌ Form task completed but no result returned.'
  }

  if (!result.success) {
    return `❌ Couldn't complete the form. ${result.next_steps || 'Please try again or do it manually.'}`
  }

  let message = '✅ Form filled!\n\n'

  if (result.submitted) {
    message += 'Submitted successfully.\n'
    if (result.confirmation_message) {
      message += `\n${result.confirmation_message}\n`
    }
  } else {
    message += 'Form filled but NOT submitted (waiting for your approval).\n'
  }

  if (result.next_steps) {
    message += `\nNext: ${result.next_steps}`
  }

  // Truncate if too long
  if (message.length > 600) {
    message = message.substring(0, 597) + '...'
  }

  return message
}
