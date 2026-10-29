'use client'

import Link from 'next/link'
import { startTransition, useActionState, useState } from 'react'
import { createStaffAction } from '../../actions'
import { initialCreateState } from '../../../admin/state'
import { THEMES } from '@/app/dashboard/themes'

export default function NewStaffForm({ siteUrl, orgName }: { siteUrl: string; orgName: string }) {
  const [state, action, pending] = useActionState(createStaffAction, initialCreateState)
  const [copied, setCopied] = useState(false)
  const err = (k: string) => (state.errors[k] ? <p className="adm-error" role="alert">{state.errors[k]}</p> : null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  if (state.ok && state.created) {
    const c = state.created
    const message =
      `Hello ${c.name}, your digital business card from ${orgName} is ready.\n\n` +
      `Your card: ${siteUrl}/${c.slug}\n` +
      `Log in to check your details: ${siteUrl}/login\n` +
      `Username: ${c.username}\n` +
      `Password: ${c.password}\n\n` +
      `Please keep your password safe. If you forget it, ask your administrator.`
    return (
      <section className="adm-box">
        <h2>Card created</h2>
        <p className="notice">The password is shown only now. Copy the message below and send it to the staff member.</p>
        <textarea readOnly rows={9} value={message} style={{ marginTop: '0.75rem' }} aria-label="Message for the staff member" />
        <div className="adm-row" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={async () => {
              try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000) }
              catch { window.prompt('Copy this message', message) }
            }}
          >
            {copied ? 'Copied' : 'Copy message'}
          </button>
          <a className="button secondary" href={`/${c.slug}`} target="_blank" rel="noopener noreferrer">Open the card</a>
          <Link className="button secondary" href="/org/staff/new">Add another</Link>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} className="adm-box" noValidate>
      <div className="adm-grid">
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" maxLength={80} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="designation">Designation (optional)</label>
          <input id="designation" name="designation" maxLength={80} />
        </div>
        <div>
          <label htmlFor="company">Branch or department (optional)</label>
          <input id="company" name="company" maxLength={80} />
        </div>
        <div>
          <label htmlFor="username">Login username</label>
          <input id="username" name="username" maxLength={30} autoCapitalize="none" spellCheck={false} />
          <p className="muted adm-hint">Small letters, numbers and hyphens. Usernames are shared by everyone on the platform, so a prefix such as your organization&apos;s short name helps.</p>
          {err('username')}
        </div>
        <div>
          <label htmlFor="slug">Card link</label>
          <input id="slug" name="slug" maxLength={40} autoCapitalize="none" spellCheck={false} placeholder="same as the username" />
          <p className="muted adm-hint">Becomes yourwebsite/this-name. It can never be changed later.</p>
          {err('slug')}
        </div>
        <div>
          <label htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" type="tel" maxLength={30} />
          {err('phone')}
        </div>
        <div>
          <label htmlFor="email">Email on the card (optional)</label>
          <input id="email" name="email" type="email" maxLength={120} />
          {err('email')}
        </div>
        <div>
          <label htmlFor="theme">Theme</label>
          <select id="theme" name="theme" defaultValue="orion">
            {THEMES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
          </select>
          <p className="muted adm-hint">Placeholder: card templates replace this later.</p>
          {err('theme')}
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create login and card'}</button>
        {state.message && !state.ok && <p className="notice adm-error-box" role="alert" style={{ marginTop: '0.75rem' }}>{state.message}</p>}
      </div>
    </form>
  )
}
