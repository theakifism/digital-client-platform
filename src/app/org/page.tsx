import Link from 'next/link'
import { requireOrgAdmin } from '@/lib/org'

type CountRow = { card_id: string; total: number; new_count: number }

export default async function OrgOverviewPage() {
  const { supabase, db, org } = await requireOrgAdmin()

  const [all, on] = await Promise.all([
    db.from('cards').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
    db.from('cards').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
  ])
  const cards = all.count ?? 0
  const active = on.count ?? 0

  // Numbers only, for this organization only (the database function reads the organization from the login).
  const { data } = await supabase.rpc('org_staff_counts')
  const rows = (data ?? []) as CountRow[]
  const messages = rows.reduce((s, r) => s + Number(r.total || 0), 0)
  const stillNew = rows.reduce((s, r) => s + Number(r.new_count || 0), 0)

  return (
    <main>
      <h1>{org.name}</h1>
      <p className="muted">The staff cards of your organization.</p>

      <div className="adm-stats">
        <div className="adm-stat"><strong>{cards} of {org.max_cards}</strong><span>cards used</span></div>
        <div className="adm-stat"><strong>{active}</strong><span>cards switched on</span></div>
        <div className="adm-stat"><strong>{messages}</strong><span>messages received</span></div>
        <div className="adm-stat"><strong>{stillNew}</strong><span>still marked New</span></div>
      </div>

      <p className="adm-row" style={{ marginTop: '1rem' }}>
        <Link className="button" href="/org/staff/new">Add a staff card</Link>
        <Link className="button secondary" href="/org/staff">See all staff cards</Link>
      </p>
      <p className="muted">You see numbers only. What visitors write belongs to each staff member.</p>
    </main>
  )
}
