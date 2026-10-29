// How the public links of photos look (Milestone 18). Server code only.
// With Supabase Storage (the default) a link is  <project address>/storage/v1/object/public/card-photos/<file>.
// With Cloudflare R2 it is R2_PUBLIC_URL/<file> (the pub-xxxx.r2.dev address while testing, your own photos.yourdomain.com for the launch).
import { profileKey } from './photo-rules'
import { storeMode } from './photo-store'

// "" means no usable address. Every check below then refuses photos instead of accepting anything.
export function photoBase(): string {
  const raw =
    storeMode() === 'r2'
      ? (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '')
      : `${(process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '')}/storage/v1/object/public/card-photos`
  return /^https:\/\/[A-Za-z0-9.\-]+(:\d+)?(\/[A-Za-z0-9._\-\/]*)?$/.test(raw) ? raw : ''
}

export const photoUrl = (key: string) => `${photoBase()}/${key}`

// A card photo link must start with this (the query "?v=..." after it is allowed).
export function profilePhotoPrefix(userId: string, cardId: string): string {
  const base = photoBase()
  return base ? `${base}/${profileKey(userId, cardId)}` : ''
}

// Gallery photo links of ONE card must start with this.
export function galleryPhotoPrefix(userId: string, cardId: string): string {
  const base = photoBase()
  return base ? `${base}/${userId}/gallery/${cardId}-` : ''
}

// For showing the public website: every photo link must start with the bucket address.
export function anyPhotoPrefix(): string {
  const base = photoBase()
  return base ? `${base}/` : ''
}

// The storage key of a public photo link, or null when the link is not one of ours.
export function keyFromUrl(url: string): string | null {
  const base = photoBase()
  if (!base || !url.startsWith(`${base}/`)) return null
  return url.slice(base.length + 1).split('?')[0].split('#')[0]
}
