// Automatic photo shrinking in the browser (Milestone 18). The person just picks a photo; this makes it fit the allowed size.
// It never asks the person to resize anything: it tries the best quality first and steps down (quality, then pixels) until the file
// is small enough. Any photo the browser can open is accepted, whatever its size or shape.
import { PHOTO } from './photo-rules'

// Tries encodings from best to smallest and returns the first that is under the target size.
// encode(scale, quality): scale 1 = full planned size, 0.5 = half the pixels on each side; quality 0..1.
// Pure logic (no browser parts), so it can be tested on its own.
export type Encode = (scale: number, quality: number) => Promise<{ size: number } | null>

const SCALES = [1, 0.85, 0.7, 0.55, 0.45]
const GOOD_QUALITIES = [0.86, 0.8, 0.74, 0.68, 0.6]
const LAST_RESORT_QUALITIES = [0.52, 0.45, 0.4, 0.34]

export async function fitUnderLimit<T extends { size: number }>(
  encode: (scale: number, quality: number) => Promise<T | null>,
  targetBytes: number,
  maxBytes: number,
): Promise<T> {
  for (const scale of SCALES) {
    for (const quality of GOOD_QUALITIES) {
      const blob = await encode(scale, quality)
      if (blob && blob.size <= targetBytes) return blob
    }
  }
  // A very detailed photo: accept lower quality on the smallest size, but never go over the hard limit.
  const smallest = SCALES[SCALES.length - 1]
  for (const quality of LAST_RESORT_QUALITIES) {
    const blob = await encode(smallest, quality)
    if (blob && blob.size <= maxBytes) return blob
  }
  throw new Error('We could not shrink that photo enough. Please try a different one.')
}

export type ShrinkOptions =
  | { shape: 'square'; side: number; targetBytes: number; maxBytes: number }
  | { shape: 'fit'; side: number; targetBytes: number; maxBytes: number }

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))

const MIN_SOURCE_SIDE = 100 // photos smaller than this are too tiny to look good on a card

// square: cut a square from the middle and make it side x side (profile photo).
// fit: keep the whole picture, longest side = side (gallery photo).
export async function shrinkImage(file: File, opts: ShrinkOptions): Promise<Blob> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('Please choose a photo (a picture file).')
  if (file.size > PHOTO.maxInputBytes) {
    throw new Error(`That file is too large (over ${Math.round(PHOTO.maxInputBytes / 1024 / 1024)} MB). Please choose a smaller photo.`)
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('We could not open that photo. Please choose a JPG, PNG or WebP photo (phone photos in the HEIC format may need to be saved as JPG first).')
  }

  try {
    const shortSide = Math.min(bitmap.width, bitmap.height)
    if (shortSide < MIN_SOURCE_SIDE) throw new Error('That photo is too small. Please choose a larger photo (at least 100 pixels wide).')

    // Never make a photo bigger than it is: that would only add file size, not sharpness.
    const planned = opts.shape === 'square' ? Math.min(opts.side, shortSide) : Math.min(opts.side, Math.max(bitmap.width, bitmap.height))

    const encode = async (scale: number, quality: number) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Your browser could not process the photo.')
      ctx.fillStyle = '#ffffff' // transparent PNGs get a white background
      ctx.imageSmoothingQuality = 'high'
      if (opts.shape === 'square') {
        const size = Math.max(PHOTO.minPixels, Math.round(planned * scale))
        canvas.width = size
        canvas.height = size
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(bitmap, (bitmap.width - shortSide) / 2, (bitmap.height - shortSide) / 2, shortSide, shortSide, 0, 0, size, size)
      } else {
        const k = (planned / Math.max(bitmap.width, bitmap.height)) * scale
        canvas.width = Math.max(PHOTO.minPixels, Math.round(bitmap.width * k))
        canvas.height = Math.max(PHOTO.minPixels, Math.round(bitmap.height * k))
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      }
      return toBlob(canvas, quality)
    }
    return await fitUnderLimit(encode, opts.targetBytes, opts.maxBytes)
  } finally {
    bitmap.close()
  }
}

export const formatKb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
