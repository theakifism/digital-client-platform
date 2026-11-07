import Link from 'next/link'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/card'
import CardEditor, { type EditableCard } from './card-editor'
import CopyLink from './copy-link'
import ActivityPanel from './activity'
import LeadsPanel from './leads-panel'
import FeedbackBox from './feedback-box'
import SearchChoice from './search-choice'
import WeeklyEmailChoice from './weekly-email-choice'
import Checklist from './checklist'
import './dashboard.css'

type Props = { searchParams: Promise<{ card?: string; leads?: string }> }

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('username, full_name').eq('id', user.id).single()

  // Row Level Security means this list can only ever contain THIS client's cards.
  type DashCard = {
    id: string; slug: string; is_active: boolean; name: string | null; designation: string | null; company: string | null
    bio: string | null; phone: string | null; whatsapp: string | null; email: string | null; address: string | null
    map_url: string | null; website: string | null; social_links: unknown; theme: string; accent_color: string | null; photo_url: string | null
    organization_id?: string | null
  }
  const withOrganization = await supabase
    .from('cards')
    .select(
      'id, slug, is_active, name, designation, company, bio, phone, whatsapp, email, address, map_url, website, social_links, theme, accent_color, photo_url, organization_id'
    )
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
  let cards = withOrganization.data as unknown as DashCard[] | null
  if (withOrganization.error) {
    // Migration 017 may not be run yet: open the dashboard without the organization lock instead of failing.
    console.error('dashboard cards (with organization) failed:', withOrganization.error.message)
    const plain = await supabase
      .from('cards')
      .select('id, slug, is_active, name, designation, company, bio, phone, whatsapp, email, address, map_url, website, social_links, theme, accent_color, photo_url')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true })
    cards = plain.data as unknown as DashCard[] | null
  }

  const { card: wanted, leads: leadsFilter } = await searchParams
  const list = cards ?? []
  const selected = list.find((c) => c.slug === wanted) ?? list[0]

  const hello = profile?.full_name || profile?.username || ''

  // The search-engine choice is read on its own. If the database step (migration 009) is not done yet,
  // this simply stays empty and the section is hidden, so the rest of the dashboard keeps working.
  let searchChoice: boolean | null = null
  if (selected) {
    const { data: s, error } = await supabase.from('cards').select('allow_search_index').eq('id', selected.id).maybeSingle()
    if (!error && s) searchChoice = (s as { allow_search_index: boolean }).allow_search_index === true
  }

  // Same safe pattern for the weekly e-mail choice (Milestone 15): if migration 012 is not run yet, the box is hidden.
  let weeklyChoice: boolean | null = null
  if (selected) {
    const { data: w, error } = await supabase.from('cards').select('weekly_email').eq('id', selected.id).maybeSingle()
    if (!error && w) weeklyChoice = (w as { weekly_email: boolean }).weekly_email === true
  }

  return (
    <main className="dash">
      <h1>Your dashboard</h1>
      <p className="muted">Hello, {hello}.</p>

      {!selected ? (
        <p className="notice">Your card is being prepared. We will let you know when it is ready.</p>
      ) : (
        <>
          {list.length > 1 && (
            <p className="dash-row">
              Your cards:{' '}
              {list.map((c) => (
                <Link key={c.slug} href={`/dashboard?card=${c.slug}`} aria-current={c.slug === selected.slug ? 'page' : undefined}>
                  {c.slug === selected.slug ? <strong>/{c.slug}</strong> : `/${c.slug}`}
                </Link>
              ))}
            </p>
          )}

          <Checklist card={selected} />

          <CardLinkBox slug={selected.slug} active={selected.is_active} />

          <section className="dash-section">
            <h2>Small website</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              A longer page with your story, services, photos, reviews and questions. It opens from a button on your card.
            </p>
            <div className="dash-row">
              <Link className="button" href={`/dashboard/website?card=${selected.slug}`}>Edit my small website</Link>
              <a href={`/${selected.slug}/site`} target="_blank" rel="noopener noreferrer">View it</a>
            </div>
          </section>

          <section className="dash-section">
            <h2>Social media posts</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Ready-made pictures for festivals and offers, filled in with your business name, phone and photo. Download and share on WhatsApp or Instagram.
            </p>
            <div className="dash-row">
              <Link className="button" href={`/dashboard/posts?card=${selected.slug}`}>Make a post</Link>
            </div>
          </section>

          <ActivityPanel cardId={selected.id} />

          <LeadsPanel cardId={selected.id} slug={selected.slug} filter={leadsFilter} />

          <div id="edit-card" />
          <CardEditor
            key={selected.id}
            ownerId={user.id}
            card={{
              id: selected.id,
              name: selected.name,
              designation: selected.designation,
              company: selected.company,
              bio: selected.bio,
              phone: selected.phone,
              whatsapp: selected.whatsapp,
              email: selected.email,
              address: selected.address,
              map_url: selected.map_url,
              website: selected.website,
              social_links: selected.social_links as EditableCard['social_links'],
              theme: selected.theme,
              accent_color: selected.accent_color,
              locked: Boolean(selected.organization_id),
              photo_url: selected.photo_url,
            }}
          />

          {searchChoice !== null && <SearchChoice key={`search-${selected.id}`} cardId={selected.id} initial={searchChoice} />}

          {weeklyChoice !== null && (
            <WeeklyEmailChoice key={`weekly-${selected.id}-${selected.email ?? ''}`} cardId={selected.id} initial={weeklyChoice} email={selected.email} />
          )}

          <FeedbackBox />
        </>
      )}
    </main>
  )
}

async function CardLinkBox({ slug, active }: { slug: string; active: boolean }) {
  const url = `${siteUrl()}/${slug}`
  const qr = await QRCode.toString(url, { type: 'svg', margin: 1, width: 160, errorCorrectionLevel: 'M' })

  return (
    <section className="dash-section" id="card-link">
      <h2>Your card link</h2>
      {!active && (
        <p className="notice" style={{ marginBottom: '0.75rem' }}>
          Your card is switched off right now, so visitors see a &quot;not found&quot; page. Please contact the team to switch it on.
        </p>
      )}
      <p className="dash-link"><a href={`/${slug}`} target="_blank" rel="noopener noreferrer">{url.replace(/^https?:\/\//, '')}</a></p>
      <div className="dash-row">
        <a className="button" href={`/${slug}`} target="_blank" rel="noopener noreferrer">Open my card</a>
        <Link className="button" href="#edit-card">Edit my card</Link>
        <CopyLink url={url} />
      </div>
      <div className="dash-qr" role="img" aria-label="QR code for your card" dangerouslySetInnerHTML={{ __html: qr }} style={{ marginTop: '1rem' }} />
    </section>
  )
}
