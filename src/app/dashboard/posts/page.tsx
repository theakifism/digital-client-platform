import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostMaker, { type PostCard } from './post-maker'
import '../dashboard.css'

type Props = { searchParams: Promise<{ card?: string }> }

export default async function PostsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Row Level Security means this list can only ever contain THIS client's cards.
  const { data: cards } = await supabase
    .from('cards')
    .select('id, slug, name, company, phone, whatsapp, photo_url')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })

  const { card: wanted } = await searchParams
  const list = cards ?? []
  const card = list.find((c) => c.slug === wanted) ?? list[0]

  if (!card) {
    return (
      <main className="dash">
        <h1>Social media posts</h1>
        <p className="notice">Your card is being prepared. You can make posts once it is ready.</p>
      </main>
    )
  }

  const postCard: PostCard = {
    slug: card.slug,
    name: card.name,
    company: card.company,
    phone: card.phone,
    whatsapp: card.whatsapp,
    photo_url: card.photo_url,
  }

  return (
    <main className="dash">
      <h1>Social media posts</h1>
      <p className="muted">
        Pick a design, check the words, then download the picture and share it on WhatsApp, Instagram or Facebook.
        Your business name, phone number and photo come from your card. The picture is made on your own phone or computer.
      </p>
      <PostMaker key={card.id} card={postCard} />
    </main>
  )
}
