import { requireAdmin } from '@/lib/admin'

type Row = {
  id: string
  created_at: string
  rating: number | null
  message: string
  owner: { username: string } | { username: string }[] | null
}

export default async function FeedbackPage() {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('feedback')
    .select('id, created_at, rating, message, owner:profiles(username)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return (
      <main>
        <h1>Client feedback</h1>
        <p className="notice">Feedback is not available yet. Run migration 008 in the Supabase SQL Editor, then reload.</p>
      </main>
    )
  }

  const rows = (data ?? []) as unknown as Row[]
  const rated = rows.filter((r) => r.rating)
  const avg = rated.length ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1) : null

  return (
    <main>
      <h1>Client feedback</h1>
      <p className="muted">
        {rows.length} message{rows.length === 1 ? '' : 's'}{avg ? `, average rating ${avg} out of 5 (${rated.length} rated)` : ''}.
      </p>

      {rows.length === 0 && <p className="notice">No feedback yet. Clients can send it from the bottom of their dashboard.</p>}

      {rows.map((r) => {
        const owner = Array.isArray(r.owner) ? r.owner[0] : r.owner
        return (
          <article key={r.id} className="adm-box">
            <div className="adm-row adm-between">
              <strong>{owner?.username ?? 'unknown client'}</strong>
              <span className="muted">{new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</span>
            </div>
            {r.rating && <p style={{ margin: '0.25rem 0' }}>Rating: <strong>{r.rating} of 5</strong></p>}
            <p style={{ whiteSpace: 'pre-wrap', margin: '0.25rem 0 0' }}>{r.message}</p>
          </article>
        )
      })}
    </main>
  )
}
