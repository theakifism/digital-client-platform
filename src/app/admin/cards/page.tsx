import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { siteUrl } from '@/lib/card'
import { BRAND } from '@/lib/brand'
import { toggleCardActive } from '../actions'
import ConfirmButton from '../confirm-button'
import Pager from '../pager'
import ResetPassword from './reset-password'

type Row = {
  id: string
  slug: string
  name: string | null
  company: string | null
  is_active: boolean
  owner_id: string | null
  owner: { username: string } | { username: string }[] | null
}

type Props = { searchParams: Promise<{ q?: string; page?: string }> }
const PAGE_SIZE = 25

export default async function CardsPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { q: rawQ, page: rawPage } = await searchParams
  const q = (rawQ ?? '').trim().slice(0, 60).replace(/[,()%*\\"]/g, ' ').trim()
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('cards')
    .select('id, slug, name, company, is_active, owner_id, owner:profiles(username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (q) query = query.or(`slug.ilike.%${q}%,name.ilike.%${q}%,company.ilike.%${q}%`)
  const { data, count } = await query
  const cards = (data ?? []) as unknown as Row[]
  const total = count ?? cards.length

  return (
    <main>
      <h1>All cards</h1>

      <form className="adm-search" action="/admin/cards" method="get">
        <input name="q" defaultValue={q} placeholder="Search by link, name or business" aria-label="Search cards" maxLength={60} />
        <button type="submit" className="secondary">Search</button>
        {q && <Link href="/admin/cards">Clear</Link>}
      </form>

      {cards.length === 0 && <p className="notice">{q ? 'No cards match your search.' : 'No cards yet.'}</p>}
      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr><th>Card</th><th>Login username</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {cards.map((c) => {
              const owner = Array.isArray(c.owner) ? c.owner[0] : c.owner
              return (
                <tr key={c.id}>
                  <td>
                    <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer">/{c.slug}</a>
                    <br /><span className="muted">{c.name}{c.company ? `, ${c.company}` : ''}</span>
                  </td>
                  <td>{owner?.username ?? <span className="muted">no owner</span>}</td>
                  <td><span className={`adm-badge ${c.is_active ? 'adm-on' : 'adm-off'}`}>{c.is_active ? 'On' : 'Off'}</span></td>
                  <td>
                    <div className="adm-row">
                      <Link className="button secondary" href={`/admin/cards/${c.id}`}>Edit</Link>
                      <form action={toggleCardActive}>
                        <input type="hidden" name="card_id" value={c.id} />
                        <input type="hidden" name="active" value={c.is_active ? 'false' : 'true'} />
                        <ConfirmButton
                          className="secondary"
                          message={c.is_active ? 'Switch this card off? Visitors will see a "not found" page until you switch it on again.' : 'Switch this card on?'}
                        >
                          {c.is_active ? 'Switch off' : 'Switch on'}
                        </ConfirmButton>
                      </form>
                      {c.owner_id && owner?.username && (
                        <ResetPassword
                          ownerId={c.owner_id}
                          username={owner.username}
                          name={c.name ?? ''}
                          slug={c.slug}
                          siteUrl={siteUrl()}
                          brandName={BRAND.name}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pager basePath="/admin/cards" params={{ q }} page={page} total={total} pageSize={PAGE_SIZE} />
    </main>
  )
}
