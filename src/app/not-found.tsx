import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container">
      <h1>Page not found</h1>
      <p className="muted">This page or card does not exist or is not available right now.</p>
      <Link href="/" className="button">Go to home</Link>
    </main>
  )
}
