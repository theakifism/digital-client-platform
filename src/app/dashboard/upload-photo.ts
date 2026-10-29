// Sends an already-shrunk photo to our own server, which checks it and stores it (Milestone 18).
// Returns the public link of the stored photo. Throws an Error with a message that can be shown to the person.
export async function uploadPhoto(kind: 'profile' | 'gallery', cardId: string, blob: Blob): Promise<string> {
  const fd = new FormData()
  fd.set('kind', kind)
  fd.set('card_id', cardId)
  fd.set('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
  let res: Response
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd })
  } catch {
    throw new Error('The upload did not work. Please check your internet and try again.')
  }
  let data: { ok?: boolean; url?: string; error?: string } = {}
  try {
    data = await res.json()
  } catch {
    // not JSON: handled below
  }
  if (!res.ok || !data.ok || !data.url) throw new Error(data.error || 'The upload did not work. Please try again.')
  return data.url
}
