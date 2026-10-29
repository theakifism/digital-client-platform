// Rate limits kept in the database (migration 011), so they hold on any host, even when the site runs as many small servers.
// Server only. If the database function is missing (migration 011 not run yet) or fails, the check says "allowed"
// and logs the problem: a broken counter must never stop real people from using the site.
import { createHmac } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// The visitor's address as the HOST reports it. Set CLIENT_IP_HEADER to the header your host fills in itself
// (Netlify: x-nf-client-connection-ip, Cloudflare: cf-connecting-ip). It falls back to x-forwarded-for, which a visitor can fake.
export function clientIp(h: Headers): string {
  const first = (v: string | null) => (v || '').split(',')[0].trim()
  const trusted = (process.env.CLIENT_IP_HEADER || 'x-nf-client-connection-ip').toLowerCase()
  return first(h.get(trusted)) || first(h.get('x-forwarded-for')) || first(h.get('x-real-ip')) || 'unknown'
}

// true = allowed, false = too many.
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('hit_rate_limit', { p_key: key, p_window_seconds: windowSeconds, p_max: max })
    if (error) {
      console.error('rate limit check failed:', error.message)
      return true
    }
    return data !== false
  } catch (e) {
    console.error('rate limit check failed:', e instanceof Error ? e.message : e)
    return true
  }
}

// Same, per visitor address. The address is scrambled before it is stored (we never keep raw addresses).
export async function limitByIp(prefix: string, h: Headers, max: number, windowSeconds: number): Promise<boolean> {
  const ip = clientIp(h)
  if (ip === 'unknown' && process.env.NODE_ENV !== 'production') return true // local testing has no address
  const hash = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'local').update(ip).digest('hex').slice(0, 20)
  return rateLimit(`${prefix}:${hash}`, max, windowSeconds)
}
