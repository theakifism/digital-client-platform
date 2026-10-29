import { NextResponse } from 'next/server'
import { checkCronSecret } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { siteUrl } from '@/lib/card'
import { OVERDUE_DAYS, buildDigest, type DigestStats } from '@/lib/digest'
import { sendAdminEmail } from '@/lib/mail'
import { photoBytesUsed } from '@/lib/photo-admin'
import { storeLimitBytes } from '@/lib/photo-store'

export const dynamic = 'force-dynamic'

// Called once a day by GitHub (.github/workflows/admin-digest.yml). Not for visitors:
// it needs the secret CRON_SECRET in the "Authorization: Bearer ..." header.
// It sends the admin an e-mail with NUMBERS ONLY when something needs attention, and a weekly summary on Mondays.

async function loadStats(): Promise<DigestStats> {
  const admin = createAdminClient()
  const since = new Date(Date.now() - OVERDUE_DAYS * 24 * 3600 * 1000).toISOString()
  const head = { count: 'exact' as const, head: true }

  const [newReq, overdue, cards, active, clients, usage] = await Promise.all([
    admin.from('requests').select('*', head).eq('status', 'new'),
    admin.from('requests').select('*', head).eq('status', 'new').lt('created_at', since),
    admin.from('cards').select('*', head),
    admin.from('cards').select('*', head).eq('is_active', true),
    admin.from('profiles').select('*', head).eq('role', 'client'),
    admin.rpc('system_usage'),
  ])
  const photosBytes: number | null = await photoBytesUsed()
  for (const [name, r] of [['requests', newReq], ['requests', overdue], ['cards', cards], ['cards', active], ['profiles', clients]] as const) {
    if (r.error) throw new Error(`${name}: ${r.error.message}`)
  }

  // The usage numbers are optional: if migration 010 has not been run, the e-mail says so instead of failing.
  let dbBytes: number | null = null
  if (usage.error) console.error('system_usage failed:', usage.error.message)
  else {
    const u = usage.data as { photos_bytes?: number; db_bytes?: number } | null
    // Photos live on Cloudflare R2 now (Milestone 18).
    dbBytes = typeof u?.db_bytes === 'number' ? u.db_bytes : null
  }

  return {
    newRequests: newReq.count ?? 0,
    overdueRequests: overdue.count ?? 0,
    cards: cards.count ?? 0,
    activeCards: active.count ?? 0,
    clients: clients.count ?? 0,
    photosBytes,
    dbBytes,
    photosLimit: storeLimitBytes(),
  }
}

// Activity numbers older than 400 days are deleted (migration 015). Best effort: a problem here never stops the e-mail check.
async function purgeOldEvents() {
  try {
    const { error } = await createAdminClient().rpc('purge_old_events', { p_days: 400 })
    if (error) console.error('purge_old_events failed:', error.message)
  } catch (e) {
    console.error('purge_old_events failed:', e instanceof Error ? e.message : e)
  }
}

export async function POST(request: Request) {
  const noStore = { 'Cache-Control': 'no-store' }
  const ok = checkCronSecret(request)
  if (ok === null) return NextResponse.json({ ok: false, error: 'CRON_SECRET is not set up on the server' }, { status: 503, headers: noStore })
  if (!ok) return NextResponse.json({ ok: false, error: 'not allowed' }, { status: 401, headers: noStore })

  const force = new URL(request.url).searchParams.get('force') === '1'
  await purgeOldEvents()

  let stats: DigestStats
  try {
    stats = await loadStats()
  } catch (e) {
    console.error('admin digest failed:', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, error: 'could not read the numbers' }, { status: 500, headers: noStore })
  }

  const digest = buildDigest(stats, new Date(), siteUrl(), force)
  if (!digest.send) return NextResponse.json({ ok: true, sent: false, reasons: [] }, { headers: noStore })

  const result = await sendAdminEmail(digest.subject, digest.text)
  // If an e-mail was due but could not be sent, answer with an error so the GitHub job turns red and you notice.
  return NextResponse.json(
    { ok: result === 'sent', sent: result === 'sent', email: result, reasons: digest.reasons },
    { status: result === 'sent' ? 200 : 503, headers: noStore }
  )
}
