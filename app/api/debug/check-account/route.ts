import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Check Auth user
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find((u: any) => u.email === email)

    // Check jordyn_users record
    const { data: jordynUser } = await supabase
      .from('jordyn_users')
      .select('*')
      .eq('email', email)
      .single()

    // Check signup sessions
    const { data: signupSessions } = await supabase
      .from('jordyn_signup_sessions')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(3)

    return NextResponse.json({
      email,
      authUserExists: !!authUser,
      authUserId: authUser?.id,
      authUserCreatedAt: authUser?.created_at,
      jordynUserExists: !!jordynUser,
      jordynUserId: jordynUser?.id,
      jordynUserHasPhone: !!jordynUser?.twilio_phone_number,
      signupSessionsCount: signupSessions?.length || 0,
      lastSignupSession: signupSessions?.[0],
      diagnosis: getDiagnosis(authUser, jordynUser, signupSessions || [])
    })
  } catch (error: any) {
    console.error('[DEBUG] Error checking account:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getDiagnosis(authUser: any, jordynUser: any, signupSessions: any[]) {
  if (!authUser && !jordynUser) {
    return 'No account found - safe to signup'
  }

  if (authUser && !jordynUser) {
    return 'ORPHANED AUTH USER - auth exists but no jordyn_users record. Cannot login or signup. Needs cleanup.'
  }

  if (!authUser && jordynUser) {
    return 'ORPHANED JORDYN USER - jordyn_users exists but no auth user. Should not happen. Needs cleanup.'
  }

  if (authUser && jordynUser && authUser.id !== jordynUser.auth_user_id) {
    return 'MISMATCHED IDs - auth user and jordyn user exist but IDs dont match. Needs investigation.'
  }

  if (authUser && jordynUser && authUser.id === jordynUser.auth_user_id) {
    if (!jordynUser.twilio_phone_number) {
      return 'INCOMPLETE SETUP - account exists but no phone provisioned. Signup may have failed partway.'
    }
    return 'COMPLETE ACCOUNT - should be able to login'
  }

  return 'Unknown state - needs manual investigation'
}
