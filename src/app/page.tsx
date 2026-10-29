import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import './ui3d.css'
import './home.css'

const SAMPLE = process.env.NEXT_PUBLIC_SAMPLE_CARD || 'demo-card'

const FEATURES = [
  { title: 'A digital card', text: 'with your photo, details and one-tap buttons.', icon: 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M8 11h.01 M13 10h5 M13 14h5' },
  { title: 'One personal link and QR code', text: 'to share on WhatsApp, social media or print anywhere.', icon: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2 M18 14h2 M14 18h2 M18 18h2' },
  { title: 'Save to contacts', text: 'so people never lose your number.', icon: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M5 20c.8-3.4 3.6-5 7-5s6.2 1.6 7 5' },
  { title: 'Easy updates.', text: 'Change your details any time and the card updates for everyone.', icon: 'M20 12a8 8 0 1 1-2.3-5.7 M20 4v5h-5' },
]

export default function HomePage() {
  return (
    <div className="ui3d">
      <main className="home">
        <header className="home-head">
          <span className="logo-chip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
          </span>
          <Link href="/login" className="button secondary home-head-login">Client login</Link>
        </header>

        <section className="home-hero">
          <div className="home-copy">
            <h1>Your business card, <span className="home-grad">online and always up to date.</span></h1>
            <p className="home-lead">
              One link that opens your digital card: call, WhatsApp, email and directions in one tap, and people can save your contact in seconds.
            </p>
            <div className="home-buttons">
              <Link href="/login" className="button">Client login</Link>
              <Link href="/contact" className="button secondary">Request a card</Link>
              <Link href={`/${SAMPLE}`} className="home-sample">See a sample card</Link>
            </div>
          </div>

          {/* A decorative stack of cards in 3D. It shows no real data. */}
          <div className="home-visual" aria-hidden="true">
            <div className="stage">
              <div className="layer l3" />
              <div className="layer l2" />
              <div className="layer l1">
                <div className="mini-top"><span className="mini-avatar" /><span className="mini-lines"><i /><i /></span></div>
                <div className="mini-actions"><span /><span /><span /><span /></div>
                <div className="mini-save" />
              </div>
              <div className="chip chip-a">Contact saved</div>
              <div className="chip chip-b">1 tap to call</div>
            </div>
          </div>
        </section>

        <section>
          <h2>What you get</h2>
          <ul className="home-grid">
            {FEATURES.map((f) => (
              <li key={f.title} className="home-tile depth-card">
                <span className="tile-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={f.icon} /></svg>
                </span>
                <p><strong>{f.title}</strong> {f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>How it works</h2>
          <ol className="home-steps">
            <li className="depth-card"><span className="step-no">1</span><p>Ask for your card. Our team sets it up for you.</p></li>
            <li className="depth-card"><span className="step-no">2</span><p>We send you a link and your login.</p></li>
            <li className="depth-card"><span className="step-no">3</span><p>Add your photo and details, then share your link.</p></li>
          </ol>
        </section>

        <footer className="home-footer">
          <span className="muted">{BRAND.name}</span>
          <Link href="/privacy">Privacy</Link>
        </footer>
      </main>
    </div>
  )
}
