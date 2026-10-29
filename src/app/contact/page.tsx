import type { Metadata } from 'next'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
import RequestForm from './request-form'
import '../ui3d.css'
import './contact.css'

export const metadata: Metadata = { title: `Request a card | ${BRAND.name}` }

export default function ContactPage() {
  return (
    <div className="ui3d">
    <div className="page-wrap">
    <main className="page-card">
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} style={{ width: 150, height: 'auto' }} />
      </Link>
      <h1>Request a card</h1>
      <p className="muted">Fill in the form and our team will contact you.</p>
      <RequestForm />
    </main>
    </div>
    </div>
  )
}
