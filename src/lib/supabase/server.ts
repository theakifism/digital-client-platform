// Supabase helper for code that runs on the SERVER (pages and route handlers).
// It reads the login cookie, so every query runs as the logged-in person
// and Row Level Security decides what they may see.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server pages cannot set cookies. This is fine because
            // the middleware refreshes the login cookie.
          }
        },
      },
    }
  )
}
