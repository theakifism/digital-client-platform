import { requireAdmin } from '@/lib/admin'
import { siteUrl } from '@/lib/card'
import { BRAND } from '@/lib/brand'
import { slugify } from '@/lib/rules'
import NewCardForm from './new-card-form'

type Props = { searchParams: Promise<{ request?: string }> }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function NewCardPage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { request } = await searchParams

  // Coming from the requests list? Fill in what the client already told us.
  let defaults = { name: '', company: '', phone: '', email: '', username: '', requestId: '' }
  if (request && UUID.test(request)) {
    const { data: r } = await supabase.from('requests').select('id, name, company, phone, email').eq('id', request).maybeSingle()
    if (r) {
      defaults = {
        name: r.name ?? '',
        company: r.company ?? '',
        phone: r.phone ?? '',
        email: r.email ?? '',
        username: slugify(r.company || r.name || ''),
        requestId: r.id,
      }
    }
  }

  return (
    <main>
      <h1>Create a client card</h1>
      <p className="muted">This creates the client&apos;s login and their card in one step.</p>
      <NewCardForm defaults={defaults} siteUrl={siteUrl()} brandName={BRAND.name} />
    </main>
  )
}
