// Middleware for authentication and route protection
// Supabase automatically handles cookie refresh
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie in both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Supabase automatically refreshes the session and sets cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /account routes
  if (request.nextUrl.pathname.startsWith('/account') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access /login, redirect to /account
  // But only if they have a jordyn_users record (avoid redirect loops)
  if (request.nextUrl.pathname === '/login' && user) {
    // Check if jordyn_user exists to avoid redirect loop
    const { data: jordynUser } = await supabase
      .from('jordyn_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (jordynUser) {
      const redirect = request.nextUrl.searchParams.get('redirect')
      const url = request.nextUrl.clone()
      url.pathname = redirect || '/account'
      url.search = ''
      return NextResponse.redirect(url)
    }
    // If no jordyn_user, allow them to stay on login page
    // (they'll see error message about account setup issue)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - they handle auth separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
