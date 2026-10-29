// Supabase client with the SERVICE ROLE key. It ignores all Row Level Security rules,
// so it must ONLY be used in server code (server actions), after checking the person is an admin.
// The key lives in .env.local as SUPABASE_SERVICE_ROLE_KEY (never NEXT_PUBLIC_, never in a zip or on GitHub).
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local and restart the server.')
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
