import Shell from '../shell'
import type { NavItem } from '../shell-nav'

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'grid', group: 'Workspace' },
  { href: '/dashboard#edit-card', label: 'My card', icon: 'card', keepCard: true, group: 'Workspace' },
  { href: '/dashboard#messages', label: 'Messages', icon: 'mail', keepCard: true, group: 'Workspace' },
  { href: '/dashboard/website', label: 'Website', short: 'Website', icon: 'globe', keepCard: true, group: 'Create' },
  { href: '/dashboard/posts', label: 'Social posts', short: 'Posts', icon: 'image', keepCard: true, group: 'Create' },
]

// The frame around every client dashboard page (Milestone 19). Each page still checks the login itself.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell title="Your workspace" who="Your digital card" items={ITEMS} mobile="dock">
      {children}
    </Shell>
  )
}
