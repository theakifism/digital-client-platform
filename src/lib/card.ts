// Loads one PUBLIC card. It uses the anonymous key with no login cookie,
// so what a visitor sees is exactly what Row Level Security allows the public to see.
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

export type PublicCard = {
  slug: string
  name: string | null
  designation: string | null
  company: string | null
  bio: string | null
  photo_url: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  map_url: string | null
  website: string | null
  social_links: Record<string, string> | null
  theme: string
  accent_color: string | null
  template: string | null
  design_config: unknown
}

// cache(): the page and its metadata ask for the same card, but the database is asked only once per visit.
export const getPublicCard = cache(async (slug: string): Promise<PublicCard | null> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data, error } = await supabase
    .from('cards')
    .select('slug, name, designation, company, bio, photo_url, phone, whatsapp, email, address, map_url, website, social_links, theme, accent_color, template, design_config')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) console.error('getPublicCard failed:', error.message)
  return (data as PublicCard | null) ?? null
})

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Did the owner allow search engines to list this card? (Milestone 12)
// Any problem, for example migration 009 not run yet, means NO. So the safe answer is always "hidden".
export const getSearchChoice = cache(async (slug: string): Promise<boolean> => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false
  const { data, error } = await anonClient().from('cards').select('allow_search_index').eq('slug', slug).eq('is_active', true).maybeSingle()
  if (error) return false
  return (data as { allow_search_index?: boolean } | null)?.allow_search_index === true
})

// The cards whose owners said yes (used for the sitemap).
export async function listIndexableCards(): Promise<{ slug: string; updated_at: string | null }[]> {
  const { data, error } = await anonClient()
    .from('cards')
    .select('slug, updated_at')
    .eq('is_active', true)
    .eq('allow_search_index', true)
    .order('slug', { ascending: true })
    .limit(5000)
  if (error) return []
  return (data ?? []) as { slug: string; updated_at: string | null }[]
}
