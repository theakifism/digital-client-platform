'use client'

import { startTransition, useActionState, useState } from 'react'
import { resetPasswordAction } from '../actions'
import { initialResetState } from '../state'

type Props = { ownerId: string; username: string; name: string; slug?: string; siteUrl: string; brandName: string }

// Only the admin can change a client's password. Leave the box empty to get a strong generated password.
// After the change, a ready message with the login details can be copied and sent to the client.
export default function ResetPassword({ ownerId, username, name, slug, siteUrl, brandName }: Props) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialResetState)
  const [typed, setTyped] = useState('')
  const [copied, setCopied] = useState(false)
  const id = `new-pw-${ownerId}`

  function onClick() {
    if (!window.confirm('Change this client\'s password? Their old password will stop working.')) return
    setCopied(false)
    const fd = new FormData()
    fd.set('owner_id', ownerId)
    fd.set('new_password', typed.trim())
    startTransition(() => action(fd))
  }

  const message = state.password
    ? `Hello ${name || username}, the password for your digital business card from ${brandName} has been changed.\n\n` +
      `Log in: ${siteUrl}/login\nUsername: ${username}\nNew password: ${state.password}` +
      (slug ? `\n\nYour card: ${siteUrl}/${slug}` : '')
    : ''

  return (
    <div>
      <label htmlFor={id} className="muted" style={{ fontSize: '0.85rem' }}>New password (optional)</label>
      <input id={id} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" maxLength={72} placeholder="Empty = generate one" />
      <button type="button" className="secondary" disabled={pending} onClick={onClick} style={{ marginTop: '0.4rem' }}>
        {pending ? 'Changing…' : 'Change password'}
      </button>
      {state.message && !state.password && (
        <p className="notice" role="status" style={{ marginTop: '0.5rem' }}>{state.message}</p>
      )}
      {state.password && (
        <div style={{ marginTop: '0.5rem' }}>
          <p className="notice" role="status">The new password is shown only now. Copy the message and send it to the client.</p>
          <textarea readOnly rows={7} value={message} aria-label="Message for the client" style={{ marginTop: '0.5rem' }} />
          <button
            type="button"
            style={{ marginTop: '0.5rem' }}
            onClick={async () => {
              try { await navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000) }
              catch { window.prompt('Copy this message', message) }
            }}
          >
            {copied ? 'Copied' : 'Copy message'}
          </button>
        </div>
      )}
    </div>
  )
}
