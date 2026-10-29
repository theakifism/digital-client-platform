'use client'

import Link from 'next/link'
import Script from 'next/script'
import { startTransition, useActionState } from 'react'
import { submitRequest } from './actions'
import { initialRequestState } from './state'

declare global {
  interface Window {
    turnstile?: { reset: () => void }
  }
}

export default function RequestForm() {
  const [state, action, pending] = useActionState(submitRequest, initialRequestState)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const err = (k: string) => (state.errors[k] ? <p className="req-error" role="alert">{state.errors[k]}</p> : null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => {
      action(fd)
    })
    // A spam-check token can only be used once, so ask for a fresh one after every try.
    window.turnstile?.reset()
  }

  if (state.ok) {
    return (
      <div className="notice" role="status">
        <strong>Thank you!</strong> We have received your request and will contact you soon.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="req" noValidate>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}

      <div>
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" maxLength={80} />
        {err('name')}
      </div>
      <div>
        <label htmlFor="company">Business name (optional)</label>
        <input id="company" name="company" autoComplete="organization" maxLength={80} />
        {err('company')}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" maxLength={120} />
        {err('email')}
      </div>
      <div>
        <label htmlFor="phone">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
        {err('phone')}
      </div>
      <div>
        <label htmlFor="message">What do you need? (optional)</label>
        <textarea id="message" name="message" rows={4} maxLength={1000} />
        {err('message')}
      </div>

      {/* Robot trap: hidden from people. */}
      <div className="req-hp" aria-hidden="true">
        <label htmlFor="company_website">Leave this empty</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="req-consent">
        <input id="consent" name="consent" type="checkbox" />
        <label htmlFor="consent">
          I agree to be contacted about my request. See our <Link href="/privacy">privacy notice</Link>.
        </label>
      </div>
      {err('consent')}

      {siteKey && <div className="cf-turnstile" data-sitekey={siteKey} />}

      <button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send request'}</button>
      {state.message && <p className="notice req-error-box" role="alert">{state.message}</p>}
    </form>
  )
}
