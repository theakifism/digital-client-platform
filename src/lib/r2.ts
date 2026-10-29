// Talks to Cloudflare R2 (Milestone 18). Server code only: the keys must never reach the browser.
// R2 speaks the same language as Amazon S3, so a small signing helper (aws4fetch) is all that is needed.
import { AwsClient } from 'aws4fetch'

type Cfg = { account: string; bucket: string; client: AwsClient }

function cfg(): Cfg | null {
  const account = (process.env.R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.R2_BUCKET || '').trim()
  if (!account || !accessKeyId || !secretAccessKey || !bucket) return null
  return { account, bucket, client: new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' }) }
}

export const r2Configured = () => cfg() !== null

const enc = (key: string) => key.split('/').map(encodeURIComponent).join('/')
const endpoint = (c: Cfg) => `https://${c.account}.r2.cloudflarestorage.com/${c.bucket}`

export async function r2Put(key: string, body: Uint8Array, contentType: string, cacheControl: string): Promise<void> {
  const c = cfg()
  if (!c) throw new Error('R2 is not set up')
  const res = await c.client.fetch(`${endpoint(c)}/${enc(key)}`, {
    method: 'PUT',
    body: body as unknown as BodyInit,
    headers: { 'Content-Type': contentType, 'Cache-Control': cacheControl },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`R2 upload failed: HTTP ${res.status}`)
}

// Deletes the given files. Returns how many were deleted. A file that is already gone counts as deleted.
export async function r2Delete(keys: string[]): Promise<number> {
  const c = cfg()
  if (!c || keys.length === 0) return 0
  let n = 0
  for (const key of keys) {
    const res = await c.client.fetch(`${endpoint(c)}/${enc(key)}`, { method: 'DELETE', signal: AbortSignal.timeout(15_000) })
    if (res.ok || res.status === 404) n++
    else console.error('R2 delete failed:', res.status, key)
  }
  return n
}

export type R2Object = { key: string; size: number; lastModified: Date }

const unescapeXml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]

// Lists the files in the bucket, up to maxPages * 1000. "truncated" means there are more than were read.
export async function r2List(maxPages = 20): Promise<{ objects: R2Object[]; truncated: boolean } | null> {
  const c = cfg()
  if (!c) return null
  const objects: R2Object[] = []
  let token: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const q = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000' })
    if (token) q.set('continuation-token', token)
    const res = await c.client.fetch(`${endpoint(c)}?${q}`, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) {
      console.error('R2 list failed:', res.status)
      return null
    }
    const xml = await res.text()
    for (const block of xml.split('<Contents>').slice(1)) {
      const key = tag(block, 'Key')
      const size = Number(tag(block, 'Size'))
      const modified = new Date(tag(block, 'LastModified') || '')
      if (key && Number.isFinite(size) && !Number.isNaN(modified.getTime())) objects.push({ key: unescapeXml(key), size, lastModified: modified })
    }
    if (tag(xml, 'IsTruncated') !== 'true') return { objects, truncated: false }
    token = tag(xml, 'NextContinuationToken')
    if (!token) return { objects, truncated: false }
  }
  return { objects, truncated: true }
}
