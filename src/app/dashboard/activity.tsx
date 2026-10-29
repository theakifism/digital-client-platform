import { createClient } from '@/lib/supabase/server'
import { ALL_EVENTS, EVENT_LABELS } from '@/lib/events'
import { lastDaysIST } from '@/lib/activity'
import './activity.css'

type Row = { type: string; total: number }

export default async function ActivityPanel({ cardId }: { cardId: string }) {
  const supabase = await createClient() // runs as the client, so only their own numbers are visible

  const [w7, w30, daily] = await Promise.all([
    supabase.rpc('card_activity', { p_card: cardId, p_days: 7 }),
    supabase.rpc('card_activity', { p_card: cardId, p_days: 30 }),
    supabase.rpc('card_daily_views', { p_card: cardId, p_days: 14 }),
  ])

  if (w7.error || w30.error) {
    return (
      <section className="dash-section">
        <h2>Activity</h2>
        <p className="notice">Activity numbers are not available yet. Run migration 006 in the Supabase SQL Editor.</p>
      </section>
    )
  }

  const toMap = (rows: Row[] | null) => new Map((rows ?? []).map((r) => [r.type, Number(r.total)]))
  const m7 = toMap(w7.data as Row[] | null)
  const m30 = toMap(w30.data as Row[] | null)

  const perDay = new Map(((daily.data ?? []) as { day: string; views: number }[]).map((r) => [String(r.day), Number(r.views)]))
  const days = lastDaysIST(14).map((d) => ({ day: d, views: perDay.get(d) ?? 0 }))
  const max = Math.max(1, ...days.map((d) => d.views))

  return (
    <section className="dash-section">
      <h2>Activity</h2>

      <div className="act-scroll">
        <table className="act-table">
          <thead>
            <tr><th scope="col">What happened</th><th scope="col">Last 7 days</th><th scope="col">Last 30 days</th></tr>
          </thead>
          <tbody>
            {ALL_EVENTS.map((t) => (
              <tr key={t}>
                <th scope="row">{EVENT_LABELS[t]}</th>
                <td>{m7.get(t) ?? 0}</td>
                <td>{m30.get(t) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="act-sub">Card views, last 14 days</h3>
      <div className="act-bars" role="img" aria-label={`Card views per day for the last 14 days. Most in one day: ${max}.`}>
        {days.map((d) => (
          <div key={d.day} className="act-bar-col" title={`${d.day}: ${d.views}`}>
            <div className="act-bar" style={{ height: `${Math.max(2, Math.round((d.views / max) * 100))}%` }} />
            <span className="act-day">{d.day.slice(8)}</span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
        Counts include your own visits. Days are in India time.
      </p>
    </section>
  )
}
