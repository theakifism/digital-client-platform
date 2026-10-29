// The rules for photos (Milestone 18). Plain code with no server parts, so the browser, the server and the tests all share it.
//
// Why these sizes (they give sharp photos for a small file):
//  - Profile photo: shown about 112 px wide on the card. 480 x 480 px is still sharp on the sharpest phone screens (4x).
//  - Gallery photo: shown at most phone-width (about 400 px) or a little wider on a computer. 1200 px on the long side is sharp at 3x.
//  - JPEG quality about 80 to 85 is the point where the eye cannot see the difference from the original, but the file is 5 to 10 times smaller.
// The browser shrinks every photo to the "target" size BEFORE upload. The server then refuses anything over the "max" size,
// so nobody can store a large file by skipping the website.

export type PhotoKind = 'profile' | 'gallery'

export const PHOTO = {
  profile: { side: 480, targetBytes: 150 * 1024, maxBytes: 250 * 1024, maxPixels: 600 },
  gallery: { side: 1200, targetBytes: 300 * 1024, maxBytes: 450 * 1024, maxPixels: 1600 },
  // A photo chosen from the phone or computer may be up to this size. It is shrunk automatically before upload.
  maxInputBytes: 30 * 1024 * 1024,
  minPixels: 32,
} as const

export const MAX_UPLOAD_REQUEST_BYTES = 600 * 1024 // the whole upload request, including the form wrapping

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
export const PROFILE_KEY_RE = new RegExp(`^${UUID}/${UUID}\\.jpg$`)
export const GALLERY_KEY_RE = new RegExp(`^${UUID}/gallery/${UUID}-[a-z0-9]{6,40}\\.jpg$`)

export function isPhotoKey(key: string): boolean {
  return PROFILE_KEY_RE.test(key) || GALLERY_KEY_RE.test(key)
}

export const profileKey = (userId: string, cardId: string) => `${userId}/${cardId}.jpg`
export const galleryKey = (userId: string, cardId: string, random: string) => `${userId}/gallery/${cardId}-${random}.jpg`

// Reads the width and height of a JPEG file WITHOUT decoding it. Returns null when the bytes are not a normal JPEG.
export function inspectJpeg(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8 || b[2] !== 0xff) return null
  let i = 2
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null
    let marker = b[i + 1]
    while (marker === 0xff && i + 2 < b.length) { i++; marker = b[i + 1] } // padding bytes
    i += 2
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue // markers without a length
    if (marker === 0xd9 || marker === 0xda) return null // end of image or start of data before a frame header
    if (i + 1 >= b.length) return null
    const len = (b[i] << 8) | b[i + 1]
    if (len < 2) return null
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isFrame) {
      if (i + 6 >= b.length) return null
      const height = (b[i + 3] << 8) | b[i + 4]
      const width = (b[i + 5] << 8) | b[i + 6]
      return width > 0 && height > 0 ? { width, height } : null
    }
    i += len
  }
  return null
}

// Checks an uploaded file against the rules for its kind. Returns an error text for the person, or null when it is fine.
export function checkPhotoBytes(kind: PhotoKind, bytes: Uint8Array): string | null {
  const rule = PHOTO[kind]
  if (bytes.length > rule.maxBytes) {
    return `That photo is still too large after shrinking (over ${Math.round(rule.maxBytes / 1024)} KB). Please choose a different photo.`
  }
  const dims = inspectJpeg(bytes)
  if (!dims) return 'That file is not a normal photo. Please choose a JPG, PNG or WebP photo.'
  if (dims.width > rule.maxPixels || dims.height > rule.maxPixels || dims.width < PHOTO.minPixels || dims.height < PHOTO.minPixels) {
    return 'That photo has an unusual size. Please choose a different photo.'
  }
  return null
}
