import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CLIENT_EVENTS } from '@/lib/events'
import { limitByIp } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: { slug?: unknown; type?: unknown } | null = null
  try {
    body = await req.json()
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  const slug = body?.slug
  const type = body?.type
  if (
    typeof slug !== 'string' || slug.length > 40 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
    typeof type !== 'string' || !(CLIENT_EVENTS as readonly string[]).includes(type)
  ) {
    return new NextResponse(null, { status: 400 })
  }

  if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(req.headers.get('user-agent') || '')) {
    return new NextResponse(null, { status: 204 })
  }

  // Limit kept in the database (migration 011): 60 counted events a minute from one visitor address.
  if (!(await limitByIp('track', req.headers, 60, 60))) return new NextResponse(null, { status: 429 })

  try {
    const admin = createAdminClient()
    const { data: card } = await admin.from('cards').select('id').eq('slug', slug).eq('is_active', true).maybeSingle()
    if (card) await admin.from('events').insert({ card_id: card.id, type })
  } catch (e) {
    console.error('track failed:', e)
  }
  return new NextResponse(null, { status: 204 })
}
