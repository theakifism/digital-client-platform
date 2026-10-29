'use client'

// Catches errors that even the normal error page cannot (a problem in the page frame itself).
// It must draw its own <html> and <body>, and it cannot use the site's styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
        <h1>Something went wrong</h1>
        <p>Please try again. If it keeps happening, contact the team that gave you your card.</p>
        <button type="button" onClick={reset} style={{ padding: '0.75rem 1rem', fontSize: '1rem' }}>Try again</button>
      </body>
    </html>
  )
}
