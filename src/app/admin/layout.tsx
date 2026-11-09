import { requireAdmin } from '@/lib/admin'
import Shell from '../shell'
import type { NavItem } from '../shell-nav'
import './admin.css'

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'grid', group: 'Workspace' },
  { href: '/admin/requests', label: 'Requests', icon: 'inbox', group: 'Workspace' },
  { href: '/admin/cards', label: 'All cards', icon: 'card', group: 'Cards' },
  { href: '/admin/cards/new', label: 'Create card', icon: 'plus', group: 'Cards' },
  { href: '/admin/cards/bulk', label: 'Bulk upload', icon: 'upload', group: 'Cards' },
  { href: '/admin/organizations', label: 'Organizations', short: 'Orgs', icon: 'globe', group: 'Accounts' },
  { href: '/admin/adoption', label: 'Pilot overview', icon: 'pulse', group: 'Insights' },
  { href: '/admin/leads', label: 'Messages', icon: 'mail', group: 'Insights' },
  { href: '/admin/feedback', label: 'Feedback', icon: 'chat', group: 'Insights' },
  { href: '/admin/storage', label: 'Photo storage', icon: 'drive', group: 'System' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { username } = await requireAdmin()

  return (
    <Shell title="Admin console" who={username} items={ITEMS} mobile="menu">
      <div className="adm">{children}</div>
    </Shell>
  )
}
