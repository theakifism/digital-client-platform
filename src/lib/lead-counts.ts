// Plain rules for the admin "Messages" page (Milestone 20). Counts only: nothing here ever holds what a visitor wrote.
export type LeadCountRow = {
  card_id: string
  card_slug: string
  card_name: string | null
  company: string | null
  is_active: boolean
  owner_username: string | null
  total: number
  new_count: number
  contacted_count: number
  won_count: number
  lost_count: number
  last_message_at: string | null
  oldest_new_at: string | null
}

// A message still marked "New" for this many days is worth a friendly nudge to the client.
export const WAITING_DAYS = 3

export function daysAgo(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / 86400000)) : null
}

export function isWaiting(r: LeadCountRow, now: number = Date.now()): boolean {
  const d = daysAgo(r.oldest_new_at, now)
  return Number(r.new_count) > 0 && d !== null && d >= WAITING_DAYS
}

export function summarizeLeads(rows: LeadCountRow[], now: number = Date.now()) {
  const n = (v: number) => Number(v || 0)
  return {
    cardsWithMessages: rows.filter((r) => n(r.total) > 0).length,
    total: rows.reduce((s, r) => s + n(r.total), 0),
    stillNew: rows.reduce((s, r) => s + n(r.new_count), 0),
    won: rows.reduce((s, r) => s + n(r.won_count), 0),
    cardsWaiting: rows.filter((r) => isWaiting(r, now)).length,
  }
}
