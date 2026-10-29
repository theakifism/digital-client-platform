import Shell from '../shell'
import type { NavItem } from '../shell-nav'

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'My card', icon: 'card', keepCard: true },
  { href: '/dashboard#messages', label: 'Messages', icon: 'mail', keepCard: true },
  { href: '/dashboard/website', label: 'Small website', short: 'Website', icon: 'globe', keepCard: true },
  { href: '/dashboard/posts', label: 'Make a post', short: 'Posts', icon: 'image', keepCard: true },
]

// The frame around every client dashboard page (Milestone 19). Each page still checks the login itself.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell title="Client dashboard" who="Your digital card" items={ITEMS} mobile="dock">
      {children}
    </Shell>
  )
}
