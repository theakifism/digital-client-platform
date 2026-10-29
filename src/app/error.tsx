'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="container">
      <h1>Something went wrong</h1>
      <p className="muted">Please try again. If it keeps happening, contact the team that gave you your card.</p>
      <p style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button type="button" onClick={reset}>Try again</button>
        <Link href="/">Go to home</Link>
      </p>
    </main>
  )
}
