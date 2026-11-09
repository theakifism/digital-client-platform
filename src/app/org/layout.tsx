import { requireOrgAdmin } from '@/lib/org'
import { BRAND } from '@/lib/brand'
import Shell from '../shell'
import type { NavItem } from '../shell-nav'
import '../admin/admin.css'

const ITEMS: NavItem[] = [
  { href: '/org', label: 'Overview', icon: 'grid' },
  { href: '/org/staff', label: 'Staff cards', short: 'Staff', icon: 'card' },
  { href: '/org/staff/new', label: 'Add staff card', short: 'Add', icon: 'plus' },
]

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const { username, org } = await requireOrgAdmin()

  return (
    <Shell title="Organization" who={`${org.name}, ${username}`} items={ITEMS} mobile="menu">
      <div className="adm">
        {org.is_active ? (
          children
        ) : (
          <main>
            <h1>{org.name}</h1>
            <p className="notice">This panel is paused. Please contact {BRAND.name}.</p>
          </main>
        )}
      </div>
    </Shell>
  )
}
