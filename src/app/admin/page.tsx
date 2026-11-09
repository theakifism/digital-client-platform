import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { formatBytes } from '@/lib/rules'
import { photoBytesUsed } from '@/lib/photo-admin'
import { storeLimitBytes, storeName } from '@/lib/photo-store'
import { getSetupChecks } from '@/lib/setup-check'

// Free plan limits (check Supabase for the current numbers).
const FREE_DB = 500 * 1024 ** 2 // 500 MB of database

export default async function AdminOverview() {
  const { supabase } = await requireAdmin()

  const count = async (table: string, filter?: [string, string | boolean]) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) q = q.eq(filter[0], filter[1])
    const { count: n } = await q
    return n ?? 0
  }
  const [cards, activeCards, clients, newRequests, allRequests, usageRes, setup] = await Promise.all([
    count('cards'),
    count('cards', ['is_active', true]),
    count('profiles', ['role', 'client']),
    count('requests', ['status', 'new']),
    count('requests'),
    supabase.rpc('admin_usage'),
    getSetupChecks(),
  ])
  const usage = usageRes.data as { photos_bytes: number; db_bytes: number } | null
  // Photos now live on Cloudflare R2 (Milestone 18), so their size comes from there. null = R2 not set up or not readable.
  const photosBytes = await photoBytesUsed()

  return (
    <main>
      <header className="adm-page-heading">
        <div><span className="adm-kicker">OPERATIONS</span><h1>Overview</h1><p className="muted">A clear view of cards, clients, and platform health.</p></div>
        <div className="adm-row"><Link className="button" href="/admin/cards/new">Create client card</Link><Link className="button secondary" href="/admin/cards/bulk">Bulk upload</Link></div>
      </header>

      <div className="adm-stats">
        <Link className="adm-stat" href="/admin/requests"><strong>{newRequests}</strong><span>new requests</span></Link>
        <Link className="adm-stat" href="/admin/cards"><strong>{cards}</strong><span>cards ({activeCards} on)</span></Link>
        <div className="adm-stat"><strong>{clients}</strong><span>client logins</span></div>
        <div className="adm-stat"><strong>{allRequests}</strong><span>requests in total</span></div>
      </div>

      <div className="adm-overview-grid">
        <section className="adm-box">
          <h2>Setup check</h2>
          <ul className="adm-checks">
            {setup.map((c) => (
              <li key={c.label}>
                <strong className={c.ok ? 'adm-ok' : 'adm-bad'}>{c.ok ? 'OK' : 'Needs attention'}</strong> · {c.label}
                {!c.ok && <div className="muted">{c.detail}</div>}
              </li>
            ))}
          </ul>
        </section>

        <section className="adm-box">
          <h2>Free plan usage</h2>
          {usage ? (
            <>
              {photosBytes === null ? (
                <p className="muted">Photos and files ({storeName()}): the size could not be read.</p>
              ) : (
                <Meter label={`Photos and files (${storeName()})`} used={photosBytes} limit={storeLimitBytes()} />
              )}
              <Meter label="Database" used={usage.db_bytes} limit={FREE_DB} />
              <p className="muted">Plan the upgrade to a paid plan when either bar passes 80%, and before you go live with all clients.</p>
            </>
          ) : (
            <p className="notice">Usage numbers are not available yet. Run migration 005 in the Supabase SQL Editor.</p>
          )}
        </section>
      </div>
    </main>
  )
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div className="adm-meter">
      <div className="adm-meter-label">
        <span>{label}</span>
        <span>{formatBytes(used)} of {formatBytes(limit)} ({pct}%)</span>
      </div>
      <div className="adm-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={pct >= 80 ? 'adm-fill adm-warn' : 'adm-fill'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
