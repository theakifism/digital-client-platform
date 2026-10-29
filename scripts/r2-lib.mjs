// A tiny helper for the photo backup and restore scripts (Milestone 18): list, download and upload files in the R2 bucket.
// Needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET in the environment.
import { AwsClient } from 'aws4fetch'

export function r2FromEnv() {
  const account = (process.env.R2_ACCOUNT_ID || '').trim()
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim()
  const bucket = (process.env.R2_BUCKET || '').trim()
  if (!account || !accessKeyId || !secretAccessKey || !bucket) return null
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' })
  const base = `https://${account}.r2.cloudflarestorage.com/${bucket}`
  const enc = (key) => key.split('/').map(encodeURIComponent).join('/')
  const tag = (xml, name) => xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]

  return {
    async list() {
      const keys = []
      let token
      for (;;) {
        const q = new URLSearchParams({ 'list-type': '2', 'max-keys': '1000' })
        if (token) q.set('continuation-token', token)
        const res = await client.fetch(`${base}?${q}`)
        if (!res.ok) throw new Error(`listing failed: HTTP ${res.status}`)
        const xml = await res.text()
        for (const block of xml.split('<Contents>').slice(1)) {
          const key = tag(block, 'Key')
          if (key) keys.push(key.replace(/&amp;/g, '&'))
        }
        if (tag(xml, 'IsTruncated') !== 'true') return keys
        token = tag(xml, 'NextContinuationToken')
        if (!token) return keys
      }
    },
    async get(key) {
      const res = await client.fetch(`${base}/${enc(key)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    },
    async put(key, bytes) {
      const res = await client.fetch(`${base}/${enc(key)}`, {
        method: 'PUT',
        body: bytes,
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    },
  }
}
