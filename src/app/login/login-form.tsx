'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usernameToEmail } from '@/lib/supabase/auth'

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function logIn(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })

    if (error) {
      setBusy(false)
      console.error(error) // visible to the developer in the browser console
      if (error.status === 429) {
        setMessage('Too many attempts. Please wait a few minutes and try again.')
      } else {
        // Same message for a wrong username and a wrong password.
        setMessage('Wrong username or password.')
      }
      return
    }

    router.replace('/after-login')
    router.refresh()
  }

  return (
    <form onSubmit={logIn} className="stack">
      <label htmlFor="username">Username</label>
      <input
        id="username"
        type="text"
        required
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={busy}>
        {busy ? 'Logging in…' : 'Log in'}
      </button>
      {message && <p className="notice">{message}</p>}
      <p className="muted">Forgot your password? Please contact the team that gave you your card.</p>
    </form>
  )
}
