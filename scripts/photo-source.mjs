// Where the photo backup and restore scripts read from and write to (Milestone 18).
// If the four R2 settings are present, the photos are on Cloudflare R2; otherwise they are in the Supabase "card-photos" bucket.
import { r2FromEnv } from './r2-lib.mjs'

const BUCKET = 'card-photos'

async function retry(label, fn) {
  let last
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }
  throw new Error(`${label}: ${last instanceof Error ? last.message : last}`)
}
export { retry }

// READ side (the backup). Supabase needs only the PUBLIC address and the public "anon" key.
export function readSource() {
  const r2 = r2FromEnv()
  if (r2) return { name: 'Cloudflare R2', listKeys: () => retry('listing the bucket', () => r2.list()), get: (key) => r2.get(key) }

  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) return null
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  async function list(prefix, offset) {
    return retry(`listing "${prefix}"`, async () => {
      const res = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prefix, limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('unexpected answer')
      return data
    })
  }
  async function walk(prefix, out, depth = 0) {
    for (let offset = 0; ; offset += 1000) {
      const items = await list(prefix, offset)
      for (const item of items) {
        if (!item.name || item.name.startsWith('.')) continue
        const p = prefix ? `${prefix}/${item.name}` : item.name
        if (item.id === null) {
          if (depth < 3) await walk(p, out, depth + 1)
        } else {
          out.push(p)
        }
      }
      if (items.length < 1000) break
    }
  }
  return {
    name: 'Supabase Storage',
    listKeys: async () => {
      const out = []
      await walk('', out)
      return out
    },
    get: async (p) => {
      const res = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${p.split('/').map(encodeURIComponent).join('/')}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    },
  }
}

// WRITE side (the restore). Supabase needs the SECRET service-role key, so this only runs on the owner's computer.
export async function writeTarget() {
  const r2 = r2FromEnv()
  if (r2) return { name: `the R2 bucket ${process.env.R2_BUCKET}`, put: (key, bytes) => r2.put(key, bytes) }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return {
    name: url,
    put: async (rel, bytes) => {
      const { error } = await supabase.storage.from(BUCKET).upload(rel, bytes, { contentType: 'image/jpeg', upsert: true })
      if (error) throw new Error(error.message)
    },
  }
}
