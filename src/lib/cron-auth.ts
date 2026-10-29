// Checks the secret sent by the scheduled GitHub jobs (Milestones 13 and 15).
// null = CRON_SECRET is not set up on the server, true/false = the caller's secret is right/wrong.
import { createHash, timingSafeEqual } from 'node:crypto'

export function checkCronSecret(request: Request): boolean | null {
  const secret = process.env.CRON_SECRET || ''
  if (secret.length < 24) return null
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(secret).digest()
  return timingSafeEqual(a, b)
}
