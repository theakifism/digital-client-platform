// Where photos are stored (Milestone 18). Server code only.
// Two places are supported, with the SAME file names, so you can switch later without changing anything else:
//  - "supabase": the "card-photos" bucket in your Supabase project. Needs nothing new. This is the default.
//  - "r2": Cloudflare R2. Used automatically when all five R2 settings are present (see MILESTONE-18.md).
import { createAdminClient } from './supabase/admin'
import { r2Configured, r2Delete, r2Put } from './r2'

export type StoreMode = 'r2' | 'supabase'

const BUCKET = 'card-photos'

export function storeMode(): StoreMode {
  return r2Configured() && /^https:\/\//.test((process.env.R2_PUBLIC_URL || '').trim()) ? 'r2' : 'supabase'
}

// Free space of the place the photos are in (for the usage meter and the admin e-mail).
export const storeLimitBytes = () => (storeMode() === 'r2' ? 10 * 1024 ** 3 : 1024 ** 3)
export const storeName = () => (storeMode() === 'r2' ? 'Cloudflare R2' : 'Supabase Storage')

// Writes one photo. Throws when it does not work.
export async function storePut(key: string, bytes: Uint8Array, cacheSeconds: number): Promise<void> {
  if (storeMode() === 'r2') {
    await r2Put(key, bytes, 'image/jpeg', cacheSeconds >= 86400 ? `public, max-age=${cacheSeconds}, immutable` : `public, max-age=${cacheSeconds}`)
    return
  }
  // The server's own key (service role) writes here, after the checks in /api/upload. Clients cannot write to the bucket themselves (migration 014).
  const { error } = await createAdminClient().storage.from(BUCKET).upload(key, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: String(cacheSeconds) })
  if (error) throw new Error(`Supabase upload failed: ${error.message}`)
}

// Deletes the given photos. Returns how many were removed.
export async function storeDelete(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0
  if (storeMode() === 'r2') return r2Delete(keys)
  const { data, error } = await createAdminClient().storage.from(BUCKET).remove(keys)
  if (error) {
    console.error('photo delete failed:', error.message)
    return 0
  }
  return data?.length ?? 0
}
