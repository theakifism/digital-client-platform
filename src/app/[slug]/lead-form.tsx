'use client'

import Link from 'next/link'
import Script from 'next/script'
import { startTransition, useActionState, useState } from 'react'
import { submitLead } from './lead-actions'
import { initialLeadState } from './lead-state'
import './lead-form.css'

declare global {
  interface Window {
    turnstile?: { reset: () => void }
  }
}

export default function LeadForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(submitLead, initialLeadState)
  const [open, setOpen] = useState(false)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const err = (k: string) => (state.errors[k] ? <p className="pc-lead-error" role="alert">{state.errors[k]}</p> : null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => {
      action(fd)
    })
    window.turnstile?.reset() // a spam-check token works only once
  }

  if (state.ok) {
    return (
      <section className="pc-lead" role="status">
        <strong>Thank you!</strong> Your message has been sent.
      </section>
    )
  }

  return (
    <section className="pc-lead">
      {!open ? (
        <button type="button" className="pc-btn pc-lead-open" onClick={() => setOpen(true)}>Send me a message</button>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
          <input type="hidden" name="slug" value={slug} />

          <div>
            <label htmlFor="lead-name">Your name</label>
            <input id="lead-name" name="name" autoComplete="name" maxLength={80} />
            {err('name')}
          </div>
          <div>
            <label htmlFor="lead-phone">Phone</label>
            <input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
            {err('phone')}
          </div>
          <div>
            <label htmlFor="lead-email">Email</label>
            <input id="lead-email" name="email" type="email" autoComplete="email" maxLength={120} />
            {err('email')}
          </div>
          {err('contact')}
          <div>
            <label htmlFor="lead-message">Message</label>
            <textarea id="lead-message" name="message" rows={3} maxLength={1000} />
            {err('message')}
          </div>

          <div className="pc-hp" aria-hidden="true">
            <label htmlFor="lead-hp">Leave this empty</label>
            <input id="lead-hp" name="contact_website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="pc-lead-consent">
            <input id="lead-consent" name="consent" type="checkbox" />
            <label htmlFor="lead-consent">
              I agree to be contacted about my message. <Link href="/privacy">Privacy notice</Link>
            </label>
          </div>
          {err('consent')}

          {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} />}

          <button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send message'}</button>
          {state.message && <p className="pc-lead-error" role="alert">{state.message}</p>}
        </form>
      )}
    </section>
  )
}
