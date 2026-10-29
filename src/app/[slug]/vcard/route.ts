import { NextResponse } from 'next/server'
import { getPublicCard, siteUrl } from '@/lib/card'
import { buildVCard } from '@/lib/vcard'
import { createAdminClient } from '@/lib/supabase/admin'
import { limitByIp } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const card = await getPublicCard(slug)
  if (!card) return new NextResponse('Card not found', { status: 404 })

  // Count it as "contact saved". Link-preview robots and floods are not counted, and a counting problem never stops the download.
  try {
    const isBot = /bot|crawler|spider|preview|facebookexternalhit|whatsapp/i.test(req.headers.get('user-agent') || '')
    if (!isBot && (await limitByIp('vcard', req.headers, 20, 600))) {
      const admin = createAdminClient()
      const { data } = await admin.from('cards').select('id').eq('slug', card.slug).maybeSingle()
      if (data) await admin.from('events').insert({ card_id: data.id, type: 'save' })
    }
  } catch (e) {
    console.error('save event failed:', e)
  }

  const body = buildVCard({ ...card, pageUrl: `${siteUrl()}/${card.slug}` })
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${card.slug}.vcf"`,
      'Cache-Control': 'no-store',
    },
  })
}
