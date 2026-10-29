import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { WAITING_DAYS, daysAgo, isWaiting, summarizeLeads, type LeadCountRow } from '@/lib/lead-counts'

type Props = { searchParams: Promise<{ show?: string }> }

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : null

export default async function AdminLeadsPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { show } = await searchParams
  const filter = show === 'waiting' ? 'waiting' : show === 'some' ? 'some' : 'all'

  const { data, error } = await supabase.rpc('admin_lead_counts')
  if (error) {
    return (
      <main>
        <h1>Messages</h1>
        <p className="notice">The numbers are not available yet. Run migrations 011 and 016 in the Supabase SQL Editor, then reload.</p>
      </main>
    )
  }

  const rows = ((data ?? []) as LeadCountRow[]).filter((r) => r.owner_username)
  const now = Date.now()
  const s = summarizeLeads(rows, now)
  const shown = filter === 'waiting' ? rows.filter((r) => isWaiting(r, now)) : filter === 'some' ? rows.filter((r) => Number(r.total) > 0) : rows

  return (
    <main>
      <h1>Messages</h1>
      <p className="muted">
        How many messages visitors sent to each card, and what the client has done with them. These are numbers only.
        The messages belong to the clients, so you never see what a visitor wrote.
      </p>

      <div className="adm-stats">
        <div className="adm-stat"><strong>{s.total}</strong><span>messages in total</span></div>
        <div className="adm-stat"><strong>{s.cardsWithMessages} of {rows.length}</strong><span>cards got a message</span></div>
        <div className="adm-stat"><strong>{s.stillNew}</strong><span>still marked New</span></div>
        <div className="adm-stat"><strong>{s.won}</strong><span>became a customer</span></div>
        <div className="adm-stat"><strong>{s.cardsWaiting}</strong><span>cards waiting {WAITING_DAYS}+ days</span></div>
      </div>

      <p className="adm-row" style={{ marginTop: '1rem' }}>
        <Link href="/admin/leads" aria-current={filter === 'all' ? 'page' : undefined}>{filter === 'all' ? <strong>All cards</strong> : 'All cards'}</Link>
        <Link href="/admin/leads?show=some" aria-current={filter === 'some' ? 'page' : undefined}>{filter === 'some' ? <strong>Got messages</strong> : 'Got messages'}</Link>
        <Link href="/admin/leads?show=waiting" aria-current={filter === 'waiting' ? 'page' : undefined}>{filter === 'waiting' ? <strong>Waiting {WAITING_DAYS}+ days</strong> : `Waiting ${WAITING_DAYS}+ days`}</Link>
      </p>

      {shown.length === 0 ? (
        <p className="notice">
          {filter === 'waiting' ? 'No client has messages waiting that long. Nice.' : filter === 'some' ? 'No card has received a message yet.' : 'No client cards yet.'}
        </p>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Client</th><th>Messages</th><th>New</th><th>Contacted</th><th>Became a customer</th>
                <th>Not interested</th><th>Oldest New</th><th>Last message</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const waiting = isWaiting(r, now)
                const age = daysAgo(r.oldest_new_at, now)
                return (
                  <tr key={r.card_id}>
                    <td>
                      <a href={`/${r.card_slug}`} target="_blank" rel="noopener noreferrer">/{r.card_slug}</a>
                      <br /><span className="muted">{r.owner_username}{r.company ? `, ${r.company}` : ''}</span>
                      {!r.is_active && <div><span className="adm-badge adm-off">Switched off</span></div>}
                    </td>
                    <td>{Number(r.total)}</td>
                    <td>
                      {Number(r.new_count)}
                      {waiting && <div><span className="adm-badge adm-new">waiting {age} days</span></div>}
                    </td>
                    <td>{Number(r.contacted_count)}</td>
                    <td>{Number(r.won_count)}</td>
                    <td>{Number(r.lost_count)}</td>
                    <td>{age === null ? <span className="muted">none</span> : `${age} day${age === 1 ? '' : 's'} ago`}</td>
                    <td>{when(r.last_message_at) ?? <span className="muted">none yet</span>}</td>
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
          <li><strong>New:</strong> the client has not changed the message from its starting status. They may well have replied already and just not updated it, so treat this as a hint, not proof.</li>
          <li><strong>Waiting {WAITING_DAYS}+ days:</strong> the oldest message still marked New arrived at least {WAITING_DAYS} days ago. A short call or WhatsApp to the client usually helps.</li>
          <li><strong>Became a customer / Not interested:</strong> the client chose these on their dashboard. They are the client&apos;s own record.</li>
        </ul>
      </section>
    </main>
  )
}
