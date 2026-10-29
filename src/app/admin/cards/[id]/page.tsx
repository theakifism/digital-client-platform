import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import AdminCardForm, { type AdminEditableCard } from './admin-card-form'
import EraseClient from './erase-client'

type Props = { params: Promise<{ id: string }> }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Row = AdminEditableCard & {
  is_active: boolean
  owner_id: string | null
  owner: { username: string } | { username: string }[] | null
}

export default async function AdminCardPage({ params }: Props) {
  const { id } = await params
  if (!UUID.test(id)) notFound()
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from('cards')
    .select('id, slug, is_active, owner_id, name, designation, company, bio, phone, whatsapp, email, address, map_url, website, social_links, theme, owner:profiles(username)')
    .eq('id', id)
    .maybeSingle()
  if (!data) notFound()
  const card = data as unknown as Row
  const owner = Array.isArray(card.owner) ? card.owner[0] : card.owner

  return (
    <main>
      <p><Link href="/admin/cards">Back to all cards</Link></p>
      <h1>Edit card: /{card.slug}</h1>
      <p className="muted">
        Login: {owner?.username ?? 'none (test card)'} ·{' '}
        <a href={`/${card.slug}`} target="_blank" rel="noopener noreferrer">Open the card</a>. The photo, small website and
        search-engine choice are edited by the client in their own dashboard. The card link can never be changed.
      </p>
      <AdminCardForm card={card} />
      <EraseClient cardId={card.id} confirmWord={owner?.username ?? card.slug} hasLogin={Boolean(owner)} />
    </main>
  )
}
