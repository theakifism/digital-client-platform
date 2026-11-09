import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import ShellNav, { type NavItem } from './shell-nav'
import './ui3d.css'

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
  mobile: 'dock' | 'menu'
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
  const initials = who.split(/[\s,]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'

  return (
    <div className="ui3d workspace-ui" data-mobile-nav={mobile}>
      <div className="shell">
        <div className="shell-mobilebar">
          <header className="shell-top">
            {logo}
            <span className="shell-mobile-title">{title}</span>
            {logout}
          </header>
          {mobile === 'menu' && (
            <details className="shell-mobile-menu">
              <summary>Open navigation <span aria-hidden="true">⌄</span></summary>
              <ShellNav items={items} variant="menu" label={`${title} navigation`} />
            </details>
          )}
        </div>

        <aside className="shell-side">
          {logo}
          <p className="shell-section-label">WORKSPACE</p>
          <ShellNav items={items} variant="side" label={title} />
          <div className="shell-foot">
            <span className="shell-avatar" aria-hidden="true">{initials}</span>
            <span className="shell-account"><strong>{who}</strong><small>Signed in</small></span>
          </div>
        </aside>

        {mobile === 'dock' && <ShellNav items={items} variant="dock" label={title} />}

        <div className="shell-main">
          <header className="shell-workbar">
            <div><span className="shell-workbar-label">{title}</span><span className="shell-workbar-caption">Manage your digital business presence</span></div>
            <div className="shell-workbar-account"><span className="shell-avatar" aria-hidden="true">{initials}</span><span>{who}</span>{logout}</div>
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}
