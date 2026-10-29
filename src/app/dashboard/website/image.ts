import { PHOTO } from '@/lib/photo-rules'
import { shrinkImage } from '@/lib/image-shrink'

// Shrinks a gallery photo in the browser BEFORE upload: whole picture kept, longest side 1200 px, JPEG under about 300 KB.
// Automatic: the person never has to resize anything. The server checks the size again (see src/lib/photo-rules.ts).
export function compressToJpeg(file: File): Promise<Blob> {
  return shrinkImage(file, { shape: 'fit', side: PHOTO.gallery.side, targetBytes: PHOTO.gallery.targetBytes, maxBytes: PHOTO.gallery.maxBytes })
}
