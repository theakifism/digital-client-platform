import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// A tiny "is everything alive?" check. It also touches the database, which keeps the free Supabase
// project awake. The weekly GitHub job calls this address (see .github/workflows/keep-alive.yml).
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await supabase.from('cards').select('id', { head: true, count: 'exact' }).limit(1)
  if (error) console.error('health check failed:', error.message)

  return NextResponse.json(
    { ok: !error, time: new Date().toISOString() },
    { status: error ? 503 : 200, headers: { 'Cache-Control': 'no-store' } }
  )
}
