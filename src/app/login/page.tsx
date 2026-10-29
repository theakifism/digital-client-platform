import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BRAND } from '@/lib/brand'
import LoginForm from './login-form'
import '../ui3d.css'

export default async function LoginPage() {
  // Already logged in? Skip the form.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/after-login')

  return (
    <div className="ui3d">
      <div className="page-wrap login-wrap">
        <span className="login-orb a" aria-hidden="true" />
        <span className="login-orb b" aria-hidden="true" />
        <main className="page-card login-card">
          <span className="logo-chip">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND.logo} alt={BRAND.name} width={BRAND.logoWidth} height={BRAND.logoHeight} />
          </span>
          <h1>Client login</h1>
          <p className="muted">Enter the username and password we gave you.</p>
          <LoginForm />
          <Link href="/" className="login-back">← Back to home</Link>
        </main>
      </div>
    </div>
  )
}
