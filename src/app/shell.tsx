import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import ShellNav, { type NavItem } from './shell-nav'
import './ui3d.css'

// The frame around the client dashboard and the admin panel (Milestone 19):
// a floating glass sidebar on computers; on phones a top bar plus either a floating dock (client) or a scrolling strip (admin).
export default function Shell({
  title,
  who,
  items,
  mobile,
  children,
}: {
  title: string
  who: string
  items: NavItem[]
  mobile: 'dock' | 'strip'
  children: React.ReactNode
}) {
  const logout = (
    <form action="/auth/signout" method="post">
      <button type="submit" className="secondary">Log out</button>
    </form>
  )
  const logo = (
    <Link href="/" className="logo-chip" aria-label={BRAND.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
    </Link>
  )

  return (
    <div className="ui3d">
      <div className="shell">
        <div className="shell-mobilebar">
          <header className="shell-top">
            {logo}
            {logout}
          </header>
          {mobile === 'strip' && <ShellNav items={items} variant="strip" label={title} />}
        </div>

        <aside className="shell-side">
          {logo}
          <p className="shell-title">{title}</p>
          <ShellNav items={items} variant="side" label={title} />
          <div className="shell-foot">
            <span className="muted">{who}</span>
            {logout}
          </div>
        </aside>

        {mobile === 'dock' && <ShellNav items={items} variant="dock" label={title} />}

        <div className="shell-main">{children}</div>
      </div>
    </div>
  )
}
