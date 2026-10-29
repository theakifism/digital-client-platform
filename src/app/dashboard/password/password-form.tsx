'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const password = String(fd.get('password') ?? '')
    const confirm = String(fd.get('confirm') ?? '')

    if (password.length < 8) return setMsg({ ok: false, text: 'Please use at least 8 characters.' })
    if (password !== confirm) return setMsg({ ok: false, text: 'The two passwords are not the same.' })

    setBusy(true)
    setMsg(null)
    const { error } = await createClient().auth.updateUser({ password })
    setBusy(false)

    if (error) {
      console.error(error.message)
      return setMsg({ ok: false, text: 'We could not change your password. For safety, log out, log in again and try once more.' })
    }
    form.reset()
    setMsg({ ok: true, text: 'Your password has been changed. Use it the next time you log in.' })
  }

  return (
    <form onSubmit={onSubmit} className="dash-section" noValidate>
      <div className="dash-grid">
        <div>
          <label htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" />
        </div>
        <div>
          <label htmlFor="confirm">Type it again</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" />
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        {msg && <p className={msg.ok ? 'notice' : 'notice dash-error-box'} role="status" style={{ marginTop: '0.75rem' }}>{msg.text}</p>}
      </div>
    </form>
  )
}
