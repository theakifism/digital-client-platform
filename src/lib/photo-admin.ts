// Admin tools for photo storage on R2 (Milestone 18): which files are unused, and how much space is used.
// FAIL CLOSED: if anything cannot be read completely, nothing is reported as unused, so a used photo can never be deleted by mistake.
import type { SupabaseClient } from '@supabase/supabase-js'
import { r2List, type R2Object } from './r2'
import { storeMode } from './photo-store'
import { createAdminClient } from './supabase/admin'
import { keyFromUrl } from './photo-url'
import { isPhotoKey } from './photo-rules'

const PAGE = 1000
const MIN_AGE_MS = 24 * 3600 * 1000 // photos less than a day old are never listed (a client may be about to save them)

async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[] | null> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1)
    if (error || !data) return null
    out.push(...data)
    if (data.length < PAGE) return out
    if (from > 200_000) return null
  }
}

// Every photo key that a card or a gallery uses right now. null = could not be read completely.
export async function usedPhotoKeys(admin: SupabaseClient): Promise<Set<string> | null> {
  const cards = await allRows<{ photo_url: string | null }>((a, b) => admin.from('cards').select('photo_url').order('id').range(a, b))
  const blocks = await allRows<{ content: unknown }>((a, b) => admin.from('card_blocks').select('content').eq('type', 'gallery').order('id').range(a, b))
  if (!cards || !blocks) return null
  const used = new Set<string>()
  for (const c of cards) {
    const k = c.photo_url ? keyFromUrl(c.photo_url) : null
    if (k) used.add(k)
  }
  for (const b of blocks) {
    const images = (b.content as { images?: unknown } | null)?.images
    if (!Array.isArray(images)) continue
    for (const i of images) {
      const url = (i as { url?: unknown } | null)?.url
      const k = typeof url === 'string' ? keyFromUrl(url) : null
      if (k) used.add(k)
    }
  }
  return used
}

// Files that nothing uses and that are over a day old. null = could not be worked out safely.
// "session" is the logged-in ADMIN's own database connection (the Supabase unused-photo list only answers to a logged-in admin).
export async function findUnusedPhotos(admin: SupabaseClient, session: SupabaseClient): Promise<R2Object[] | null> {
  if (storeMode() === 'supabase') {
    const { data, error } = await session.rpc('admin_unused_photos')
    if (error || !Array.isArray(data)) return null
    return (data as { file_name: string; size_bytes: number; uploaded_at: string }[])
      .filter((r) => isPhotoKey(r.file_name))
      .map((r) => ({ key: r.file_name, size: Number(r.size_bytes) || 0, lastModified: new Date(r.uploaded_at) }))
  }
  const listed = await r2List(50)
  if (!listed || listed.truncated) return null
  const used = await usedPhotoKeys(admin)
  if (!used) return null
  const cutoff = Date.now() - MIN_AGE_MS
  return listed.objects
    .filter((o) => isPhotoKey(o.key) && !used.has(o.key) && o.lastModified.getTime() < cutoff)
    .sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
}

// Total bytes of all photos (for the usage meter and the admin e-mail). null = could not be read.
export async function photoBytesUsed(): Promise<number | null> {
  if (storeMode() === 'supabase') {
    const { data, error } = await createAdminClient().rpc('system_usage') // migration 010
    const n = (data as { photos_bytes?: number } | null)?.photos_bytes
    return error || typeof n !== 'number' ? null : n
  }
  const listed = await r2List(20)
  if (!listed) return null
  return listed.objects.reduce((s, o) => s + o.size, 0)
}
