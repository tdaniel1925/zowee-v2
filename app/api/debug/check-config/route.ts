import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment configuration
 */
export async function GET() {
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      anthropic_api_key: {
        exists: !!process.env.ANTHROPIC_API_KEY,
        prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
      },
      supabase_url: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      },
      supabase_service_key: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...' || 'NOT SET',
      },
      twilio_account_sid: {
        exists: !!process.env.TWILIO_ACCOUNT_SID,
        prefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...' || 'NOT SET',
      },
      browserbase_api_key: {
        exists: !!process.env.BROWSERBASE_API_KEY,
        prefix: process.env.BROWSERBASE_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
      },
      stripe_secret_key: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...' || 'NOT SET',
      },
    },
    critical_missing: [] as string[],
  }

  // Identify critical missing keys
  if (!config.checks.anthropic_api_key.exists) {
    config.critical_missing.push('ANTHROPIC_API_KEY')
  }
  if (!config.checks.supabase_url.exists) {
    config.critical_missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!config.checks.supabase_service_key.exists) {
    config.critical_missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  return NextResponse.json(config)
}
