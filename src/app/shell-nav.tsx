'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Small line icons (24x24). Each icon is a few path strokes.
const ICONS = {
  card: ['M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z', 'M8 11h.01', 'M13 10h5', 'M13 14h5', 'M6 16c.4-1.4 3.6-1.4 4 0'],
  globe: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18', 'M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z'],
  image: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8.5 9.5h.01', 'M21 16l-5-5-8 8'],
  mail: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'M3 7l9 6 9-6'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  inbox: ['M4 13l2.5-7h11L20 13', 'M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5', 'M4 13h4l1 2h6l1-2h4'],
  plus: ['M12 5v14', 'M5 12h14'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  pulse: ['M3 12h4l3-8 4 16 3-8h4'],
  chat: ['M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z'],
  drive: ['M4 14h16v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z', 'M4 14l2.5-8h11L20 14', 'M8 17h.01', 'M12 17h4'],
} as const

export type IconName = keyof typeof ICONS
export type NavItem = { href: string; label: string; short?: string; icon: IconName; keepCard?: boolean }

function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

const pathOf = (href: string) => href.split('#')[0].split('?')[0]

function Items({ items, variant, label }: { items: NavItem[]; variant: 'side' | 'dock' | 'strip'; label: string }) {
  const pathname = usePathname()
  const card = useSearchParams().get('card')

  // The item whose address is the longest match for the page you are on is the active one.
  let active = -1
  let best = -1
  items.forEach((it, i) => {
    if (it.href.includes('#')) return
    const p = pathOf(it.href)
    const hit = pathname === p || pathname.startsWith(p + '/')
    if (hit && p.length > best) {
      best = p.length
      active = i
    }
  })

  return (
    <nav className={`shell-nav shell-nav-${variant}`} aria-label={label}>
      {items.map((it, i) => {
        const href = it.keepCard && card ? `${it.href.split('#')[0]}?card=${encodeURIComponent(card)}${it.href.includes('#') ? '#' + it.href.split('#')[1] : ''}` : it.href
        return (
          <Link key={it.href} href={href} aria-current={i === active ? 'page' : undefined}>
            <Icon name={it.icon} />
            <span>{variant === 'dock' && it.short ? it.short : it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function ShellNav(props: { items: NavItem[]; variant: 'side' | 'dock' | 'strip'; label: string }) {
  return (
    <Suspense fallback={<nav className={`shell-nav shell-nav-${props.variant}`} aria-label={props.label} />}>
      <Items {...props} />
    </Suspense>
  )
}
