import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import { toggleOrganizationActive } from './actions'
import ConfirmButton from '../confirm-button'
import ResetPassword from '../cards/reset-password'
import { siteUrl } from '@/lib/card'
import { BRAND } from '@/lib/brand'

type Org = { id: string; name: string; slug: string; max_cards: number; is_active: boolean; created_at: string }

export default async function OrganizationsPage() {
  const { supabase } = await requireAdmin()

  const { data: orgData, error } = await supabase.from('organizations').select('id, name, slug, max_cards, is_active, created_at').order('created_at', { ascending: false })
  if (error) {
    return (
      <main>
        <h1>Organizations</h1>
        <p className="notice">Not available yet. Run migration 017 in the Supabase SQL Editor, then reload.</p>
      </main>
    )
  }
  const orgs = (orgData ?? []) as Org[]

  const { data: cardRows } = await supabase.from('cards').select('organization_id').not('organization_id', 'is', null).limit(20000)
  const used = new Map<string, number>()
  for (const r of cardRows ?? []) used.set(r.organization_id as string, (used.get(r.organization_id as string) ?? 0) + 1)

  const { data: adminRows } = await supabase.from('profiles').select('id, username, organization_id').eq('role', 'org_admin')
  const admins = new Map<string, { id: string; username: string }[]>()
  for (const r of adminRows ?? []) {
    const key = r.organization_id as string
    admins.set(key, [...(admins.get(key) ?? []), { id: r.id as string, username: r.username as string }])
  }

  return (
    <main>
      <h1>Organizations</h1>
      <p className="muted">Banks, departments and companies. Each has its own administrator who manages only its own staff cards.</p>
      <p><Link className="button" href="/admin/organizations/new">Create an organization</Link></p>

      {orgs.length === 0 && <p className="notice">No organizations yet.</p>}
      {orgs.length > 0 && (
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr><th>Organization</th><th>Administrator login</th><th>Cards</th><th>Panel</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orgs.map((o) => {
                const n = used.get(o.id) ?? 0
                return (
                  <tr key={o.id}>
                    <td>{o.name}<br /><span className="muted">{o.slug}</span></td>
                    <td>{(admins.get(o.id) ?? []).map((x) => x.username).join(', ') || <span className="muted">none</span>}</td>
                    <td>{n} of {o.max_cards}{n >= o.max_cards && <div><span className="adm-badge adm-new">limit reached</span></div>}</td>
                    <td><span className={`adm-badge ${o.is_active ? 'adm-on' : 'adm-off'}`}>{o.is_active ? 'Open' : 'Paused'}</span></td>
                    <td>
                      <div className="adm-row">
                      <form action={toggleOrganizationActive}>
                        <input type="hidden" name="org_id" value={o.id} />
                        <input type="hidden" name="active" value={o.is_active ? 'false' : 'true'} />
                        <ConfirmButton
                          className="secondary"
                          message={o.is_active ? 'Pause this organization\'s panel? Its staff cards stay as they are; only its administrator is locked out.' : 'Open this organization\'s panel again?'}
                        >
                          {o.is_active ? 'Pause panel' : 'Open panel'}
                        </ConfirmButton>
                      </form>
                      {(admins.get(o.id) ?? []).map((x) => (
                        <ResetPassword key={x.id} ownerId={x.id} username={x.username} name={o.name} siteUrl={siteUrl()} brandName={BRAND.name} />
                      ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
