import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BLOCK_TYPES, coerceContent, emptyContent, type BlockType } from '@/lib/block-schema'
import { galleryPhotoPrefix } from '@/lib/photo-url'
import WebsiteEditor, { type EditorBlock } from './website-editor'
import '../dashboard.css'

type Props = { searchParams: Promise<{ card?: string }> }

export default async function WebsitePage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cards } = await supabase.from('cards').select('id, slug').eq('owner_id', user.id).order('created_at', { ascending: true })
  const { card: wanted } = await searchParams
  const list = cards ?? []
  const card = list.find((c) => c.slug === wanted) ?? list[0]

  if (!card) {
    return (
      <main className="dash">
          <h1>Your small website</h1>
        <p className="notice">Your card is being prepared. You can build your website once it is ready.</p>
      </main>
    )
  }

  const { data: rows } = await supabase.from('card_blocks').select('type, position, is_visible, content').eq('card_id', card.id)

  // Keep the saved order, then add the sections that have not been created yet.
  const photoPrefix = galleryPhotoPrefix(user.id, card.id)
  const saved = [...(rows ?? [])]
    .filter((r) => (BLOCK_TYPES as readonly string[]).includes(r.type))
    .sort((a, b) => a.position - b.position)
  const initial: EditorBlock[] = saved.map((r) => ({
    type: r.type as BlockType,
    visible: r.is_visible === true,
    content: coerceContent(r.type as BlockType, r.content, photoPrefix),
  }))
  for (const type of BLOCK_TYPES) {
    if (!initial.some((b) => b.type === type)) initial.push({ type, visible: false, content: emptyContent(type) })
  }

  return (
    <main className="dash">
      <h1>Your small website</h1>
      <p className="muted">
        Turn sections on, fill them in and put them in the order you like. Your contact details come from your card.{' '}
        <a href={`/${card.slug}/site`} target="_blank" rel="noopener noreferrer">View my website</a>
      </p>
      <WebsiteEditor key={card.id} cardId={card.id} ownerId={user.id} initial={initial} />
    </main>
  )
}
