import Link from 'next/link'
import { requireOrgAdmin } from '@/lib/org'
import { toggleStaffActive, setStaffAppearance } from '../actions'
import { THEMES } from '@/app/dashboard/themes'
import { DEFAULT_ACCENTS } from '@/lib/card-accent'
import ConfirmButton from '../../admin/confirm-button'
import Pager from '../../admin/pager'

type Row = {
  id: string
  slug: string
  name: string | null
  designation: string | null
  is_active: boolean
  theme: string
  accent_color: string | null
  owner: { username: string } | { username: string }[] | null
}
type CountRow = { card_id: string; total: number; new_count: number }

type Props = { searchParams: Promise<{ page?: string }> }
const PAGE_SIZE = 25

export default async function OrgStaffPage({ searchParams }: Props) {
  const { supabase, db, org } = await requireOrgAdmin()
  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  const { data, count } = await db
    .from('cards')
    .select('id, slug, name, designation, is_active, theme, accent_color, owner:profiles(username)', { count: 'exact' })
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  const cards = (data ?? []) as unknown as Row[]

  const { data: counts } = await supabase.rpc('org_staff_counts')
  const byCard = new Map(((counts ?? []) as CountRow[]).map((r) => [r.card_id, r]))

  return (
    <main>
      <h1>Staff cards</h1>
      <p className="muted"><Link href="/org/staff/new">Add a staff card</Link></p>

      {cards.length === 0 && <p className="notice">No staff cards yet.</p>}
      <div className="adm-scroll">
        <table className="adm-table">
          <thead>
            <tr><th>Card</th><th>Login username</th><th>Messages</th><th>Still New</th><th>Status</th><th>Card colours</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {cards.map((c) => {
              const owner = Array.isArray(c.owner) ? c.owner[0] : c.owner
              const n = byCard.get(c.id)
              return (
                <tr key={c.id}>
                  <td>
                    <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer">/{c.slug}</a>
                    <br /><span className="muted">{c.name}{c.designation ? `, ${c.designation}` : ''}</span>
                  </td>
                  <td>{owner?.username ?? <span className="muted">none</span>}</td>
                  <td>{Number(n?.total ?? 0)}</td>
                  <td>{Number(n?.new_count ?? 0)}</td>
                  <td><span className={`adm-badge ${c.is_active ? 'adm-on' : 'adm-off'}`}>{c.is_active ? 'On' : 'Off'}</span></td>
                  <td>
                    <form action={setStaffAppearance} className="adm-row">
                      <input type="hidden" name="card_id" value={c.id} />
                      <select name="theme" defaultValue={THEMES.some((t) => t.id === c.theme) ? c.theme : 'light'} aria-label={`Colours for ${c.name ?? c.slug}`}>
                        {THEMES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                      </select>
                      <input name="accent_color" type="color" defaultValue={c.accent_color ?? DEFAULT_ACCENTS[c.theme] ?? DEFAULT_ACCENTS.orion} aria-label={`Accent color for ${c.name ?? c.slug}`} />
                      <button type="submit" className="secondary">Save</button>
                    </form>
                  </td>
                  <td>
                    <form action={toggleStaffActive}>
                      <input type="hidden" name="card_id" value={c.id} />
                      <input type="hidden" name="active" value={c.is_active ? 'false' : 'true'} />
                      <ConfirmButton
                        className="secondary"
                        message={c.is_active ? 'Switch this card off? Visitors will see a "not found" page until you switch it on again.' : 'Switch this card on?'}
                      >
                        {c.is_active ? 'Switch off' : 'Switch on'}
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pager basePath="/org/staff" params={{}} page={page} total={count ?? cards.length} pageSize={PAGE_SIZE} />
    </main>
  )
}
