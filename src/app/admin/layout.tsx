import { requireAdmin } from '@/lib/admin'
import Shell from '../shell'
import type { NavItem } from '../shell-nav'
import './admin.css'

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'grid' },
  { href: '/admin/requests', label: 'Requests', icon: 'inbox' },
  { href: '/admin/cards', label: 'Cards', icon: 'card' },
  { href: '/admin/cards/new', label: 'New card', icon: 'plus' },
  { href: '/admin/cards/bulk', label: 'Bulk upload', icon: 'upload' },
  { href: '/admin/organizations', label: 'Organizations', short: 'Orgs', icon: 'globe' },
  { href: '/admin/adoption', label: 'Pilot overview', icon: 'pulse' },
  { href: '/admin/leads', label: 'Messages', icon: 'mail' },
  { href: '/admin/feedback', label: 'Feedback', icon: 'chat' },
  { href: '/admin/storage', label: 'Photo storage', icon: 'drive' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { username } = await requireAdmin()

  return (
    <Shell title="Admin" who={username} items={ITEMS} mobile="strip">
      <div className="adm">{children}</div>
    </Shell>
  )
}
