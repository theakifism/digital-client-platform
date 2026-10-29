import { PHOTO } from '@/lib/photo-rules'
import { shrinkImage } from '@/lib/image-shrink'

// Shrinks a profile photo in the browser BEFORE it is uploaded: square cut from the middle, 480x480, JPEG under about 150 KB.
// Automatic: the person never has to resize anything. The server checks the size again (see src/lib/photo-rules.ts).
export function compressToSquareJpeg(file: File): Promise<Blob> {
  return shrinkImage(file, { shape: 'square', side: PHOTO.profile.side, targetBytes: PHOTO.profile.targetBytes, maxBytes: PHOTO.profile.maxBytes })
}
