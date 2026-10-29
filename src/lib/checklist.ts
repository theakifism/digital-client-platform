// The "Get your card ready" checklist on the client dashboard (Milestone 16).
// Plain rules with no server code inside, so they are easy to test.

export type ChecklistInput = {
  photo_url: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  social_links: Record<string, string> | null
  visibleBlocks: number | null // null = could not be read: the item is left out instead of showing a wrong answer
  viewsEver: number | null
}

export type ChecklistItem = { id: string; label: string; hint: string; done: boolean; href: string }

const has = (v: string | null | undefined) => !!v && v.trim() !== ''

export function buildChecklist(c: ChecklistInput, slug: string): ChecklistItem[] {
  const edit = '#edit-card'
  const site = `/dashboard/website?card=${encodeURIComponent(slug)}`
  const items: ChecklistItem[] = [
    { id: 'photo', label: 'Add your photo or logo', hint: 'A face or logo makes visitors trust your card.', done: has(c.photo_url), href: edit },
    { id: 'bio', label: 'Write a short bio', hint: 'Two or three lines about what you do (at least 20 characters).', done: has(c.bio) && c.bio!.trim().length >= 20, href: edit },
    { id: 'phone', label: 'Add your phone number', hint: 'It powers the Call button.', done: has(c.phone), href: edit },
    { id: 'whatsapp', label: 'Add your WhatsApp number', hint: 'Most customers in India prefer to message first.', done: has(c.whatsapp), href: edit },
    { id: 'email', label: 'Add your e-mail address', hint: 'Messages from visitors and your weekly e-mail go here.', done: has(c.email), href: edit },
    { id: 'social', label: 'Add a social media link', hint: 'Instagram, Facebook, LinkedIn or YouTube.', done: Object.values(c.social_links ?? {}).some((v) => has(v)), href: edit },
  ]
  if (c.visibleBlocks !== null) {
    items.push({ id: 'site', label: 'Fill in your small website', hint: 'Add at least one section: about, services, photos, reviews or questions.', done: c.visibleBlocks > 0, href: site })
  }
  if (c.viewsEver !== null) {
    items.push({ id: 'view', label: 'Get your first visit', hint: 'Share your link or QR code on WhatsApp, on invoices or at your shop.', done: c.viewsEver > 0, href: '#card-link' })
  }
  return items
}

export function progress(items: ChecklistItem[]): { done: number; total: number; percent: number } {
  const done = items.filter((i) => i.done).length
  return { done, total: items.length, percent: items.length === 0 ? 100 : Math.round((done / items.length) * 100) }
}
