import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCsv } from '@/lib/csv'
import { LEAD_LABELS, isLeadStatus } from '@/lib/lead-status'

export const dynamic = 'force-dynamic'

// Downloads all messages for one of the logged-in client's own cards as a CSV file (opens in Excel).
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Please log in.', { status: 401 })

  const slug = req.nextUrl.searchParams.get('card') ?? ''
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return new NextResponse('Not found', { status: 404 })

  // Row Level Security: this only finds the card if it belongs to this client.
  const { data: card } = await supabase.from('cards').select('id').eq('slug', slug).eq('owner_id', user.id).maybeSingle()
  if (!card) return new NextResponse('Not found', { status: 404 })

  // Milestone 14 added a status and a private note. If migration 011 has not been run yet,
  // fall back to the plain list so the download keeps working.
  const full = await supabase
    .from('leads')
    .select('created_at, name, phone, email, message, status, note')
    .eq('card_id', card.id)
    .order('created_at', { ascending: false })
    .limit(5000)
  const withFollowUp = !full.error
  type Row = { created_at: string; name: string | null; phone: string | null; email: string | null; message: string | null; status?: string | null; note?: string | null }
  let data = (full.data ?? []) as Row[]
  if (!withFollowUp) {
    const plain = await supabase
      .from('leads')
      .select('created_at, name, phone, email, message')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false })
      .limit(5000)
    data = (plain.data ?? []) as Row[]
  }

  const rows: string[][] = [withFollowUp ? ['Date', 'Name', 'Phone', 'Email', 'Message', 'Status', 'My note'] : ['Date', 'Name', 'Phone', 'Email', 'Message']]
  for (const l of data) {
    const row = [
      new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      l.name ?? '', l.phone ?? '', l.email ?? '', l.message ?? '',
    ]
    if (withFollowUp) row.push(isLeadStatus(l.status) ? LEAD_LABELS[l.status] : LEAD_LABELS.new, l.note ?? '')
    rows.push(row)
  }

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse('\uFEFF' + toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="messages-${slug}-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
