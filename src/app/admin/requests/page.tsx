import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { deleteRequest, setRequestStatus } from '../actions'
import ConfirmButton from '../confirm-button'
import Pager from '../pager'

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> }

const LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', card_created: 'Card created' }
const PAGE_SIZE = 25

export default async function RequestsPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { status, q: rawQ, page: rawPage } = await searchParams
  const filter = status && LABEL[status] ? status : ''
  const q = (rawQ ?? '').trim().slice(0, 60).replace(/[,()%*\\"]/g, ' ').trim()
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('requests')
    .select('id, created_at, name, company, phone, email, message, status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (filter) query = query.eq('status', filter)
  if (q) query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
  const { data, count } = await query
  const requests = data ?? []
  const total = count ?? requests.length

  return (
    <main>
      <h1>Card requests</h1>
      <p className="adm-row">
        <Link href={q ? `/admin/requests?q=${encodeURIComponent(q)}` : '/admin/requests'} aria-current={!filter ? 'page' : undefined}>{!filter ? <strong>All</strong> : 'All'}</Link>
        {Object.entries(LABEL).map(([key, label]) => (
          <Link key={key} href={`/admin/requests?status=${key}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={filter === key ? 'page' : undefined}>
            {filter === key ? <strong>{label}</strong> : label}
          </Link>
        ))}
      </p>

      <form className="adm-search" action="/admin/requests" method="get">
        {filter && <input type="hidden" name="status" value={filter} />}
        <input name="q" defaultValue={q} placeholder="Search by name, business, e-mail or phone" aria-label="Search requests" maxLength={60} />
        <button type="submit" className="secondary">Search</button>
        {q && <Link href={filter ? `/admin/requests?status=${filter}` : '/admin/requests'}>Clear</Link>}
      </form>

      {requests.length === 0 && <p className="notice">{q ? 'No requests match your search.' : 'No requests here yet.'}</p>}

      {requests.map((r) => (
        <article key={r.id} className="adm-box">
          <div className="adm-row adm-between">
            <h2 style={{ margin: 0 }}>{r.name}{r.company ? `, ${r.company}` : ''}</h2>
            <span className={`adm-badge adm-${r.status}`}>{LABEL[r.status] ?? r.status}</span>
          </div>
          <p className="muted" style={{ margin: '0.25rem 0 0.5rem' }}>
            {new Date(r.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
          </p>
          <p style={{ margin: '0 0 0.25rem' }}>
            <a href={`mailto:${r.email}`}>{r.email}</a>
            {r.phone && <> · <a href={`tel:${String(r.phone).replace(/[^\d+]/g, '')}`}>{r.phone}</a></>}
          </p>
          {r.message && <p style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0' }}>{r.message}</p>}

          <div className="adm-row" style={{ marginTop: '0.75rem' }}>
            <form action={setRequestStatus} className="adm-row">
              <input type="hidden" name="request_id" value={r.id} />
              <select name="status" defaultValue={r.status} aria-label="Status">
                {Object.entries(LABEL).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
              <button type="submit" className="secondary">Update</button>
            </form>
            {r.status !== 'card_created' && (
              <Link className="button" href={`/admin/cards/new?request=${r.id}`}>Create card for this client</Link>
            )}
            <form action={deleteRequest}>
              <input type="hidden" name="request_id" value={r.id} />
              <ConfirmButton className="secondary" message="Delete this request for good? This cannot be undone.">Delete</ConfirmButton>
            </form>
          </div>
        </article>
      ))}

      <Pager basePath="/admin/requests" params={{ status: filter, q }} page={page} total={total} pageSize={PAGE_SIZE} />
    </main>
  )
}
