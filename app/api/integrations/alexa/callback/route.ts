import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Alexa OAuth callback
 * Exchanges code for access token and saves to user preferences
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/account/integrations?error=alexa_denied`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/account/integrations?error=no_code`)
  }

  const supabase = createClient()

  // Check auth
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.ALEXA_CLIENT_ID!,
        client_secret: process.env.ALEXA_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/alexa/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Get Pokkit user
    const { data: pokkitUser } = await supabase
      .from('jordyn_users')
      .select('id, preferences')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!pokkitUser) {
      throw new Error('Pokkit user not found')
    }

    // Save tokens to user preferences
    const preferences = pokkitUser.preferences || {}
    preferences.alexa_token = access_token
    preferences.alexa_refresh_token = refresh_token
    preferences.alexa_token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString()

    await supabase
      .from('jordyn_users')
      .update({ preferences })
      .eq('id', pokkitUser.id)

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/account/integrations?success=alexa_linked`)
  } catch (error) {
    console.error('Alexa OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/account/integrations?error=alexa_failed`)
  }
}
