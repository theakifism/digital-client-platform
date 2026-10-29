'use client'

import Link from 'next/link'
import { startTransition, useActionState, useState } from 'react'
import { createOrganizationAction } from '../actions'
import { initialOrgCreateState } from '../state'

export default function NewOrgForm({ siteUrl, brandName }: { siteUrl: string; brandName: string }) {
  const [state, action, pending] = useActionState(createOrganizationAction, initialOrgCreateState)
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
      `Hello, the ${brandName} panel for ${c.orgName} is ready.\n\n` +
      `Log in here: ${siteUrl}/login\n` +
      `Username: ${c.username}\n` +
      `Password: ${c.password}\n\n` +
      `After logging in you can add and manage the staff cards of ${c.orgName}.\n` +
      `Please keep the password safe. If you forget it, contact us and we will give you a new one.`
    return (
      <section className="adm-box">
        <h2>Organization created</h2>
        <p className="notice">The password is shown only now. Copy the message below and send it to the administrator.</p>
        <textarea readOnly rows={9} value={message} style={{ marginTop: '0.75rem' }} aria-label="Message for the administrator" />
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
          <Link className="button secondary" href="/admin/organizations">All organizations</Link>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} className="adm-box" noValidate>
      <div className="adm-grid">
        <div>
          <label htmlFor="name">Organization name</label>
          <input id="name" name="name" maxLength={80} />
          {err('name')}
        </div>
        <div>
          <label htmlFor="slug">Short name</label>
          <input id="slug" name="slug" maxLength={40} autoCapitalize="none" spellCheck={false} />
          <p className="muted adm-hint">Small letters, numbers and hyphens. Used inside the system only.</p>
          {err('slug')}
        </div>
        <div>
          <label htmlFor="max_cards">Card limit</label>
          <input id="max_cards" name="max_cards" type="number" min={1} max={100000} defaultValue={25} />
          {err('max_cards')}
        </div>
        <div>
          <label htmlFor="admin_name">Administrator&apos;s name (optional)</label>
          <input id="admin_name" name="admin_name" maxLength={80} />
        </div>
        <div>
          <label htmlFor="username">Administrator login username</label>
          <input id="username" name="username" maxLength={30} autoCapitalize="none" spellCheck={false} />
          {err('username')}
        </div>
        <div>
          <label htmlFor="password">Password (optional)</label>
          <input id="password" name="password" autoComplete="off" placeholder="Leave empty to generate a strong one" />
          {err('password')}
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create organization and login'}</button>
        {state.message && !state.ok && <p className="notice adm-error-box" role="alert" style={{ marginTop: '0.75rem' }}>{state.message}</p>}
      </div>
    </form>
  )
}
