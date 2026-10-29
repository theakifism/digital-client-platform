'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { BLOCK_TYPES, coerceContent, type BlockType, type GalleryContent } from '@/lib/block-schema'
import { galleryPhotoPrefix, keyFromUrl } from '@/lib/photo-url'
import { GALLERY_KEY_RE } from '@/lib/photo-rules'
import { storeDelete } from '@/lib/photo-store'
import type { SiteState } from './state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function saveWebsite(_prev: SiteState, fd: FormData): Promise<SiteState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  const raw = String(fd.get('payload') ?? '')
  if (raw.length > 200_000) return { ok: false, message: 'That is too much content. Please shorten it.' }
  let payload: { cardId?: unknown; blocks?: unknown }
  try {
    payload = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'Something went wrong. Please refresh the page.' }
  }

  const cardId = String(payload.cardId ?? '')
  if (!UUID.test(cardId) || !Array.isArray(payload.blocks) || payload.blocks.length > BLOCK_TYPES.length) {
    return { ok: false, message: 'Something went wrong. Please refresh the page.' }
  }

  // Row Level Security: this finds the card only if it belongs to this client.
  const { data: card } = await supabase.from('cards').select('id').eq('id', cardId).eq('owner_id', user.id).maybeSingle()
  if (!card) return { ok: false, message: 'We could not find your card.' }

  // "" when photo storage (R2) is not set up: then no gallery photo link is accepted.
  const galleryPrefix = galleryPhotoPrefix(user.id, cardId)

  const seen = new Set<string>()
  const rows = []
  for (let i = 0; i < payload.blocks.length; i++) {
    const b = payload.blocks[i] as { type?: unknown; visible?: unknown; content?: unknown }
    const type = String(b?.type ?? '') as BlockType
    if (!(BLOCK_TYPES as readonly string[]).includes(type) || seen.has(type)) {
      return { ok: false, message: 'Something went wrong. Please refresh the page.' }
    }
    seen.add(type)
    rows.push({
      card_id: cardId,
      type,
      position: i,
      is_visible: b.visible === true,
      content: coerceContent(type, b.content, galleryPrefix),
    })
  }

  // Remember the old gallery photos, so photos that were removed can be deleted afterwards.
  const { data: oldGallery } = await supabase.from('card_blocks').select('content').eq('card_id', cardId).eq('type', 'gallery').maybeSingle()

  const { error } = await supabase.from('card_blocks').upsert(rows, { onConflict: 'card_id,type' })
  if (error) {
    console.error('saveWebsite failed:', error.message)
    return { ok: false, message: 'We could not save your website. Please try again, or contact the team if it keeps happening.' }
  }

  // Delete photo files that are no longer used (this client's own folder only), to save storage.
  try {
    const keep = new Set(((rows.find((r) => r.type === 'gallery')?.content as GalleryContent | undefined)?.images ?? []).map((i) => i.url))
    // The old data is cleaned with the same strict rule, so only real photo files of this card can ever be deleted.
    const old = (coerceContent('gallery', oldGallery?.content, galleryPrefix) as GalleryContent).images
      .map((i) => i.url)
      .filter((u) => !keep.has(u))
    // Only files in THIS client's own gallery folder of THIS card can be deleted.
    const own = `${user.id}/gallery/${cardId}-`
    const paths = old.map((u) => keyFromUrl(u)).filter((k): k is string => !!k && k.startsWith(own) && GALLERY_KEY_RE.test(k))
    if (paths.length > 0) await storeDelete(paths)
  } catch (e) {
    console.error('photo cleanup failed:', e)
  }

  revalidatePath('/dashboard/website')
  return { ok: true, message: 'Saved. Sections with nothing in them are not shown on your website.' }
}
