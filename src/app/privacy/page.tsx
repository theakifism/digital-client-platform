import type { Metadata } from 'next'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import '../ui3d.css'

export const metadata: Metadata = { title: `Privacy notice | ${BRAND.name}` }

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL

export default function PrivacyPage() {
  return (
    <div className="ui3d">
    <div className="page-wrap">
    <main className="page-card">
      <h1>Privacy notice</h1>
      <p className="muted">How {BRAND.name} handles your information.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>When you request a card:</strong> your name, email, phone number (if you give it), business name and message.</li>
        <li><strong>For a client card:</strong> the details the client chooses to show on the card, such as name, photo, phone, email, address and links. Anyone with the card link can see these.</li>
        <li><strong>Enquiries sent through a card:</strong> the name, phone and message the visitor enters.</li>
      </ul>

      <h2>Why we collect it</h2>
      <p>To answer your request, to create and run your digital card, and to pass enquiries on to the card owner. We do not sell your information.</p>

      <h2>Who can see it</h2>
      <p>Our team can see requests and cards. A card owner can see the enquiries sent to their own card. Our service providers store and send the data for us.</p>

      <h2>Your choices</h2>
      <p>You can ask us to correct or delete your information at any time{CONTACT ? <>, by writing to <a href={`mailto:${CONTACT}`}>{CONTACT}</a></> : ', by contacting the team that gave you your card'}.</p>

      <p><Link href="/">Back to home</Link></p>
    </main>
    </div>
    </div>
  )
}
