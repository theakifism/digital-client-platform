// Loads the visible, cleaned blocks of one PUBLIC card (anonymous key, no login cookie).
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { anyPhotoPrefix } from './photo-url'
import { BLOCK_TYPES, coerceContent, isBlank, type BlockContent, type BlockType } from './block-schema'

export type PublicBlock = { type: BlockType; content: BlockContent }

// cache(): the page and its metadata ask for the same blocks, but the database is asked only once per visit.
export const getPublicBlocks = cache(async (slug: string): Promise<PublicBlock[]> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return []
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')

  const supabase = createClient(base, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Row Level Security only returns blocks that are switched on, and only for active cards.
  const { data, error } = await supabase
    .from('cards')
    .select('card_blocks(type, position, content)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) console.error('getPublicBlocks failed:', error.message)

  const rows = ((data?.card_blocks ?? []) as { type: string; position: number; content: unknown }[]).filter((r) =>
    (BLOCK_TYPES as readonly string[]).includes(r.type)
  )
  const photoPrefix = anyPhotoPrefix()

  return rows
    .sort((a, b) => a.position - b.position)
    .map((r) => ({ type: r.type as BlockType, content: coerceContent(r.type as BlockType, r.content, photoPrefix) }))
    .filter((b) => !isBlank(b.type, b.content))
})
