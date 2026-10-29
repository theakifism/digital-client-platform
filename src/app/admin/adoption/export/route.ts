import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { completeness, statusOf, type AdoptionRow } from '@/lib/adoption'
import { toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

// The pilot overview as a CSV file, for your pilot report. Admin only.
export async function GET() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.rpc('admin_adoption')
  if (error) return new NextResponse('Run migration 008 first.', { status: 500 })

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '')
  const rows: string[][] = [[
    'Username', 'Card link', 'Name', 'Business', 'Status', 'Last login', 'Card created',
    'Basics filled in (of 4)', 'Photo', 'Description', 'Phone', 'Social links',
    'Website sections', 'Views (30 days)', 'Messages', 'Last activity',
  ]]
  for (const r of ((data ?? []) as AdoptionRow[]).filter((x) => x.owner_username)) {
    rows.push([
      r.owner_username ?? '', `/${r.card_slug}`, r.card_name ?? '', r.company ?? '', statusOf(r).label,
      fmt(r.last_sign_in_at), fmt(r.card_created_at), String(completeness(r)),
      r.has_photo ? 'yes' : 'no', r.has_bio ? 'yes' : 'no', r.has_phone ? 'yes' : 'no', String(Number(r.social_count)),
      String(Number(r.site_sections)), String(Number(r.views_30d)), String(Number(r.messages)), fmt(r.last_activity),
    ])
  }

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse('\uFEFF' + toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pilot-overview-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
