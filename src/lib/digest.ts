// Works out whether the admin needs an e-mail today, and what it says (Milestone 13).
// It only ever uses COUNTS and sizes. It never contains what a visitor or a client wrote.
import { formatBytes } from './rules'
import { BRAND } from './brand'

export type DigestStats = {
  newRequests: number
  overdueRequests: number // still "new" after OVERDUE_DAYS
  cards: number
  activeCards: number
  clients: number
  photosBytes: number | null // null = could not be read
  dbBytes: number | null
  photosLimit?: number // size of the place the photos are in; default FREE_STORAGE
}

export const FREE_STORAGE = 1024 ** 3 // 1 GB of photos on the Supabase free plan (10 GB if the photos are on Cloudflare R2, see photosLimit)
export const FREE_DB = 500 * 1024 ** 2 // 500 MB of database on the free plan
export const OVERDUE_DAYS = 2
export const USAGE_WARN = 0.8

// Monday in India (the weekly summary day).
export function isMondayIST(now: Date): boolean {
  return new Date(now.getTime() + 5.5 * 3600 * 1000).getUTCDay() === 1
}

const pct = (used: number, limit: number) => Math.round((used / limit) * 100)

export type Digest = { send: boolean; subject: string; text: string; reasons: string[] }

export function buildDigest(s: DigestStats, now: Date, siteBase: string, force = false): Digest {
  const reasons: string[] = []
  if (s.overdueRequests > 0) reasons.push(`${s.overdueRequests} card request${s.overdueRequests === 1 ? '' : 's'} waiting more than ${OVERDUE_DAYS} days`)
  const photosLimit = s.photosLimit ?? FREE_STORAGE
  const photoPct = s.photosBytes === null ? null : pct(s.photosBytes, photosLimit)
  const dbPct = s.dbBytes === null ? null : pct(s.dbBytes, FREE_DB)
  if (photoPct !== null && photoPct >= USAGE_WARN * 100) reasons.push(`photo storage is ${photoPct}% full`)
  if (dbPct !== null && dbPct >= USAGE_WARN * 100) reasons.push(`the database is ${dbPct}% full`)

  const needsAttention = reasons.length > 0
  const weekly = isMondayIST(now)
  const send = needsAttention || weekly || force
  if (!needsAttention && weekly) reasons.push('weekly summary')
  if (!needsAttention && !weekly && force) reasons.push('sent on request')

  const base = siteBase.replace(/\/$/, '')
  const usage = (label: string, used: number | null, limit: number, p: number | null) =>
    used === null || p === null ? `${label}: could not be read` : `${label}: ${formatBytes(used)} of ${formatBytes(limit)} (${p}%)`

  const lines = [
    needsAttention ? 'Something needs your attention:' : 'Everything looks fine. This is your weekly summary.',
    ...(needsAttention ? reasons.map((r) => `- ${r}`) : []),
    '',
    `New card requests waiting: ${s.newRequests}`,
    `Cards: ${s.cards} (${s.activeCards} switched on)`,
    `Client logins: ${s.clients}`,
    usage('Photo storage', s.photosBytes, photosLimit, photoPct),
    usage('Database', s.dbBytes, FREE_DB, dbPct),
    '',
    `Card requests: ${base}/admin/requests`,
    `Overview and usage: ${base}/admin`,
    `Unused photos: ${base}/admin/storage`,
    '',
    'This e-mail only shows numbers. It never shows what visitors or clients wrote.',
  ]
  return {
    send,
    subject: needsAttention ? `${BRAND.name} cards: needs your attention` : `${BRAND.name} cards: weekly summary`,
    text: lines.join('\n'),
    reasons,
  }
}
