import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { storePut } from '@/lib/photo-store'
import { photoUrl } from '@/lib/photo-url'
import { rateLimit } from '@/lib/ratelimit'
import { MAX_UPLOAD_REQUEST_BYTES, checkPhotoBytes, galleryKey, profileKey, type PhotoKind } from '@/lib/photo-rules'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// The ONLY way a photo gets into storage (Milestone 18). The browser has already shrunk the photo;
// this server check does not trust that: it checks the login, that the card belongs to this client,
// the file size, and that the bytes really are a JPEG of a sensible size. The storage path is built here, never taken from the browser.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  if (!photoUrl('x').startsWith('https://')) return fail('Photo storage is not set up yet. Please tell the team.', 503)

  const declared = Number(request.headers.get('content-length') || 0)
  if (declared > MAX_UPLOAD_REQUEST_BYTES) return fail('That photo is too large. Please choose a different photo.', 413)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return fail('Please log in again.', 401)
  // Limits kept in the database (migration 015): 40 uploads per 10 minutes and 150 per day for one login.
  // The daily limit also keeps a client from filling the free storage with photos they never save.
  if (!(await rateLimit(`upload10:${user.id}`, 40, 600)) || !(await rateLimit(`uploadday:${user.id}`, 150, 86400))) {
    return fail('You are uploading too fast. Please wait a few minutes and try again.', 429)
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail('The upload did not work. Please try again.', 400)
  }

  const kind = String(form.get('kind') ?? '')
  const cardId = String(form.get('card_id') ?? '')
  const file = form.get('file')
  if ((kind !== 'profile' && kind !== 'gallery') || !UUID.test(cardId) || !(file instanceof File)) {
    return fail('The upload did not work. Please try again.', 400)
  }

  // Row Level Security plus the owner check: this only finds the card if it belongs to this client.
  const { data: card } = await supabase.from('cards').select('id').eq('id', cardId).eq('owner_id', user.id).maybeSingle()
  if (!card) return fail('We could not find your card.', 403)

  const bytes = new Uint8Array(await file.arrayBuffer())
  const problem = checkPhotoBytes(kind as PhotoKind, bytes)
  if (problem) return fail(problem, 400)

  const key = kind === 'profile' ? profileKey(user.id, cardId) : galleryKey(user.id, cardId, randomBytes(8).toString('hex'))
  try {
    await storePut(key, bytes, kind === 'profile' ? 3600 : 31536000)
  } catch (e) {
    console.error('upload failed:', e instanceof Error ? e.message : e)
    return fail('The upload did not work. Please try again.', 502)
  }

  return NextResponse.json({ ok: true, url: photoUrl(key), bytes: bytes.length }, { headers: { 'Cache-Control': 'no-store' } })
}
