/**
 * Browserbase Types
 * Type definitions for browser automation tasks
 */

import { SMSIntent } from '@/lib/sms/parser'

export type BrowserTaskType =
  | 'research'
  | 'form_fill'
  | 'payment'
  | 'flight_search'
  | 'hotel_search'
  | 'restaurant_search'

export type BrowserTaskStatus =
  | 'pending' // waiting to be picked up by Twin
  | 'pending_confirmation' // waiting for user confirmation (e.g., payment)
  | 'running' // currently being executed by Twin
  | 'completed' // successfully completed
  | 'failed' // failed with error

export interface BrowserTask {
  id: string
  user_id: string
  task_type: BrowserTaskType
  status: BrowserTaskStatus

  // Input
  intent: SMSIntent
  instructions: string

  // Conversation threading
  reply_to_number?: string // The Jordyn number user texted TO (so we reply FROM same number)

  // Browser session
  browserbase_session_id?: string
  browserbase_url?: string

  // Results
  result?: any
  error?: string
  screenshot_url?: string

  // Timing
  started_at?: string
  completed_at?: string
  processing_ms?: number

  // Notification
  notified_at?: string

  created_at: string
  updated_at: string
}

export interface CreateBrowserTaskInput {
  user_id: string
  task_type: BrowserTaskType
  status?: BrowserTaskStatus
  intent: SMSIntent
  instructions: string
  reply_to_number?: string // The Jordyn number user texted TO
}

export interface UserProfile {
  name?: string
  email?: string
  phone?: string
  payment_methods?: PaymentMethod[]
  preferences?: UserPreferences
  contacts?: Contact[]
}

export interface PaymentMethod {
  type: 'stripe_payment_method'
  id: string
  last4: string
  brand: string
  exp_month: number
  exp_year: number
}

export interface UserPreferences {
  airline_seat?: 'window' | 'aisle' | 'middle'
  dietary_restrictions?: string[]
  special_requests?: string
  home_airport?: string
  default_travelers?: number
}

export interface Contact {
  name: string
  phone?: string
  email?: string
  relationship?: string
}

// Result types for different task types

export interface ResearchResult {
  findings: ResearchFinding[]
  summary: string
  sources?: string[]
}

export interface ResearchFinding {
  site: string
  title: string
  price?: string
  rating?: string
  availability?: string
  url: string
  details?: Record<string, any>
}

export interface FormFillResult {
  success: boolean
  form_url: string
  fields_filled: Record<string, string>
  submitted: boolean
  confirmation_message?: string
  next_steps?: string
}

export interface PaymentResult {
  success: boolean
  merchant: string
  amount: number
  currency: string
  payment_method: {
    last4: string
    brand: string
  }
  confirmation_number?: string
  receipt_url?: string
  stripe_charge_id?: string
}
