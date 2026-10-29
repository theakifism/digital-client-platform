// The follow-up status of a message from a visitor (Milestone 14).
// Plain rules with no server code inside, so they are easy to test.

export const LEAD_STATUSES = ['new', 'contacted', 'won', 'lost'] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  won: 'Became a customer',
  lost: 'Not interested',
}

export const NOTE_MAX = 1000

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSES as readonly string[]).includes(v)
}

// Which messages the dashboard list shows. Anything unknown means "all".
export type LeadFilter = 'all' | LeadStatus
export function parseLeadFilter(v: string | undefined | null): LeadFilter {
  return isLeadStatus(v) ? v : 'all'
}

// Cleans a note typed by the client: tidy line breaks, remove hidden control characters, trim.
// Returns null for an empty note and an error text when it is too long.
export function cleanNote(input: string): { note: string | null; error?: string } {
  const text = input.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
  if (text.length > NOTE_MAX) return { note: null, error: `The note is too long (${text.length} characters). The limit is ${NOTE_MAX}.` }
  return { note: text === '' ? null : text }
}

// Counts per status, for the filter tabs.
export function tallyStatuses(rows: { status?: string | null }[]): Record<LeadStatus, number> {
  const out: Record<LeadStatus, number> = { new: 0, contacted: 0, won: 0, lost: 0 }
  for (const r of rows) out[isLeadStatus(r.status) ? r.status : 'new'] += 1
  return out
}
