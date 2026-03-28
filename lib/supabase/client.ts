// Supabase client for Client Components
// Supabase handles ALL cookie operations automatically in the browser
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // Cookies are automatically managed by Supabase
  // httpOnly, secure, sameSite all handled automatically
}
