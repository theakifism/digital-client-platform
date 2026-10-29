import { requireAdmin } from '@/lib/admin'
import { siteUrl } from '@/lib/card'
import { BRAND } from '@/lib/brand'
import NewOrgForm from './new-org-form'

export default async function NewOrganizationPage() {
  await requireAdmin()
  return (
    <main>
      <h1>Create an organization</h1>
      <p className="muted">This creates the organization and the login of its administrator in one step.</p>
      <NewOrgForm siteUrl={siteUrl()} brandName={BRAND.name} />
    </main>
  )
}
