import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { completeness, daysSince, statusOf, summarize, type AdoptionRow } from '@/lib/adoption'

type Props = { searchParams: Promise<{ show?: string }> }

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : null

export default async function AdoptionPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { show } = await searchParams
  const onlyHelp = show === 'help'

  const { data, error } = await supabase.rpc('admin_adoption')
  if (error) {
    return (
      <main>
        <h1>Pilot overview</h1>
        <p className="notice">The numbers are not available yet. Run migration 008 in the Supabase SQL Editor, then reload.</p>
      </main>
    )
  }

  const rows = ((data ?? []) as AdoptionRow[]).filter((r) => r.owner_username)
  const s = summarize(rows)
  const shown = onlyHelp ? rows.filter((r) => ['never', 'help'].includes(statusOf(r).key)) : rows

  return (
    <main>
      <h1>Pilot overview</h1>
      <p className="muted">How are the clients getting on? These numbers only count activity. They never show what visitors wrote.</p>

      <div className="adm-stats">
        <div className="adm-stat"><strong>{s.loggedIn} of {s.cards}</strong><span>logged in ({s.loggedInPct}%)</span></div>
        <div className="adm-stat"><strong>{s.complete} of {s.cards}</strong><span>card filled in ({s.completePct}%)</span></div>
        <div className="adm-stat"><strong>{s.withSite} of {s.cards}</strong><span>have a small website ({s.withSitePct}%)</span></div>
        <div className="adm-stat"><strong>{s.seen} of {s.cards}</strong><span>seen by visitors, last 30 days ({s.seenPct}%)</span></div>
        <div className="adm-stat"><strong>{s.messages}</strong><span>messages from visitors</span></div>
      </div>

      <p className="adm-row" style={{ marginTop: '1rem' }}>
        <Link href="/admin/adoption" aria-current={!onlyHelp ? 'page' : undefined}>{!onlyHelp ? <strong>All clients</strong> : 'All clients'}</Link>
        <Link href="/admin/adoption?show=help" aria-current={onlyHelp ? 'page' : undefined}>{onlyHelp ? <strong>Need a nudge</strong> : 'Need a nudge'}</Link>
           {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="button secondary" href="/admin/adoption/export">Download as CSV</a>
      </p>

      {shown.length === 0 ? (
        <p className="notice">{onlyHelp ? 'Nobody needs a nudge right now.' : 'No client cards yet.'}</p>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Client</th><th>Status</th><th>Last login</th><th>Card filled in</th>
                <th>Website sections</th><th>Views (30 days)</th><th>Messages</th><th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const st = statusOf(r)
                const age = daysSince(r.card_created_at)
                const badge = st.key === 'ready' ? 'adm-on' : st.key === 'off' ? 'adm-off' : 'adm-new'
                const missing = [!r.has_photo && 'photo', !r.has_bio && 'description', !r.has_phone && 'phone', Number(r.social_count) === 0 && 'social link'].filter(Boolean).join(', ')
                return (
                  <tr key={r.card_id}>
                    <td>
                      <a href={`/${r.card_slug}`} target="_blank" rel="noopener noreferrer">/{r.card_slug}</a>
                      <br /><span className="muted">{r.owner_username}{r.company ? `, ${r.company}` : ''}</span>
                    </td>
                    <td>
                      <span className={`adm-badge ${badge}`}>{st.label}</span>
                      {st.key === 'never' && age !== null && <div className="muted">card is {age} day{age === 1 ? '' : 's'} old</div>}
                    </td>
                    <td>{when(r.last_sign_in_at) ?? <span className="muted">never</span>}</td>
                    <td>
                      {completeness(r)} of 4
                      {missing && <div className="muted">missing: {missing}</div>}
                    </td>
                    <td>{Number(r.site_sections)}</td>
                    <td>{Number(r.views_30d)}</td>
                    <td>{Number(r.messages)}</td>
                    <td>{when(r.last_activity) ?? <span className="muted">none yet</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="adm-box">
        <h2>What the words mean</h2>
        <ul>
          <li><strong>Never logged in:</strong> the client has not opened the dashboard yet. A call or message usually fixes it.</li>
          <li><strong>Needs help:</strong> logged in, but fewer than 3 of the 4 basics are filled in (photo, description, phone, one social link).</li>
          <li><strong>Ready:</strong> logged in and at least 3 of the 4 basics are filled in.</li>
          <li><strong>Views:</strong> card views in the last 30 days, including the client&apos;s own visits.</li>
        </ul>
      </section>
    </main>
  )
}
