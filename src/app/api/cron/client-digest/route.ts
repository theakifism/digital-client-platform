import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { siteUrl } from '@/lib/card'
import { checkCronSecret } from '@/lib/cron-auth'
import { isMondayIST } from '@/lib/digest'
import { buildClientDigest, type CardWeek } from '@/lib/client-digest'
import { sendClientEmail } from '@/lib/mail'

export const dynamic = 'force-dynamic'

// Called by GitHub (.github/workflows/client-digest.yml) on Monday mornings, in small batches
// (the free host stops a request after a few seconds). Needs CRON_SECRET in the Authorization header.
// Query: offset=<n> (start of the batch), force=1 (send on any day), dry=1 (count only, send nothing).
const BATCH = 10
const PAUSE_MS = 600 // the free Resend plan allows about 2 e-mails a second

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(request: Request) {
  const noStore = { 'Cache-Control': 'no-store' }
  const ok = checkCronSecret(request)
  if (ok === null) return NextResponse.json({ ok: false, error: 'CRON_SECRET is not set up on the server' }, { status: 503, headers: noStore })
  if (!ok) return NextResponse.json({ ok: false, error: 'not allowed' }, { status: 401, headers: noStore })

  const q = new URL(request.url).searchParams
  const force = q.get('force') === '1'
  const dry = q.get('dry') === '1'
  const offset = Math.max(0, Math.min(100000, parseInt(q.get('offset') || '0', 10) || 0))

  if (!force && !dry && !isMondayIST(new Date())) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 'not Monday', next_offset: null }, { headers: noStore })
  }

  const { data, error } = await createAdminClient().rpc('weekly_card_stats')
  if (error) {
    console.error('weekly_card_stats failed:', error.message)
    return NextResponse.json({ ok: false, error: 'could not read the numbers (is migration 012 run?)' }, { status: 500, headers: noStore })
  }
  const all = (data ?? []) as CardWeek[]
  const batch = all.slice(offset, offset + BATCH)
  const next = offset + BATCH < all.length ? offset + BATCH : null

  if (dry) return NextResponse.json({ ok: true, dry: true, recipients: all.length, in_this_batch: batch.length, next_offset: next }, { headers: noStore })

  let sent = 0
  let failed = 0
  let notConfigured = 0
  for (const c of batch) {
    const mail = buildClientDigest(c, siteUrl())
    const r = await sendClientEmail(c.email, mail.subject, mail.text)
    if (r === 'sent') sent++
    else if (r === 'not_configured') notConfigured++
    else failed++
    await sleep(PAUSE_MS)
  }

  const good = failed === 0 && notConfigured === 0
  return NextResponse.json(
    { ok: good, sent, failed, not_configured: notConfigured, recipients: all.length, next_offset: next },
    { status: good ? 200 : 503, headers: noStore },
  )
}
