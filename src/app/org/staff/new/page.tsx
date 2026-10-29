import { requireOrgAdmin } from '@/lib/org'
import { siteUrl } from '@/lib/card'
import NewStaffForm from './new-staff-form'

export default async function NewStaffPage() {
  const { db, org } = await requireOrgAdmin()
  const { count } = await db.from('cards').select('id', { count: 'exact', head: true }).eq('organization_id', org.id)
  const left = Math.max(0, org.max_cards - (count ?? 0))

  return (
    <main>
      <h1>Add a staff card</h1>
      <p className="muted">This creates the staff member&apos;s login and card. {left} of {org.max_cards} cards left.</p>
      {left === 0 ? (
        <p className="notice">Your organization has used all its cards. Please contact us to add more.</p>
      ) : (
        <NewStaffForm siteUrl={siteUrl()} orgName={org.name} />
      )}
    </main>
  )
}
