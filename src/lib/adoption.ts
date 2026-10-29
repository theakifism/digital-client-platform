// Turns the raw adoption numbers into plain words for the admin's pilot page.
export type AdoptionRow = {
  card_id: string
  card_slug: string
  card_name: string | null
  company: string | null
  is_active: boolean
  owner_username: string | null
  last_sign_in_at: string | null
  card_created_at: string
  has_photo: boolean
  has_bio: boolean
  has_phone: boolean
  social_count: number
  site_sections: number
  views_30d: number
  messages: number
  last_activity: string | null
}

// How many of the 4 basics are filled in: photo, description, phone, at least one social link.
export function completeness(r: AdoptionRow): number {
  return [r.has_photo, r.has_bio, r.has_phone, Number(r.social_count) > 0].filter(Boolean).length
}

export type StatusKey = 'off' | 'never' | 'help' | 'ready'

export function statusOf(r: AdoptionRow): { key: StatusKey; label: string } {
  if (!r.is_active) return { key: 'off', label: 'Switched off' }
  if (!r.last_sign_in_at) return { key: 'never', label: 'Never logged in' }
  if (completeness(r) < 3) return { key: 'help', label: 'Needs help' }
  return { key: 'ready', label: 'Ready' }
}

export function daysSince(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86400000)) : null
}

export function summarize(rows: AdoptionRow[]) {
  const active = rows.filter((r) => r.is_active)
  const n = active.length
  const pct = (x: number) => (n === 0 ? 0 : Math.round((x / n) * 100))
  const loggedIn = active.filter((r) => r.last_sign_in_at).length
  const complete = active.filter((r) => completeness(r) >= 3).length
  const withSite = active.filter((r) => Number(r.site_sections) > 0).length
  const seen = active.filter((r) => Number(r.views_30d) > 0).length
  return {
    cards: n,
    loggedIn, loggedInPct: pct(loggedIn),
    complete, completePct: pct(complete),
    withSite, withSitePct: pct(withSite),
    seen, seenPct: pct(seen),
    messages: rows.reduce((s, r) => s + Number(r.messages || 0), 0),
  }
}
