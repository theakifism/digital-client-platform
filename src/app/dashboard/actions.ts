'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validateCard } from './validate'
import { profilePhotoPrefix } from '@/lib/photo-url'
import type { SaveState } from './state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function saveCard(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.', errors: {} }

  const cardId = String(formData.get('card_id') ?? '')
  if (!UUID.test(cardId)) return { ok: false, message: 'Something went wrong. Please refresh the page.', errors: {} }

  // "" when photo storage (R2) is not set up: then no photo link is accepted.
  const photoPrefix = profilePhotoPrefix(user.id, cardId)

  const { values, errors } = validateCard(formData, photoPrefix)
  if (!values) {
    return { ok: false, message: 'Please fix the highlighted fields and save again.', errors }
  }

  // Runs as the logged-in client, so Row Level Security only lets them change THEIR OWN card.
  // (The link, owner and on/off switch are protected by the database as well.)
  // A card that belongs to an organization keeps the design (template and colour) the organization chose. The database enforces this too.
  const { data: current } = await supabase.from('cards').select('organization_id').eq('id', cardId).maybeSingle()
  const update: Record<string, unknown> = { ...values }
  if (current?.organization_id) {
    delete update.theme
    delete update.template
  }

  const { data, error } = await supabase.from('cards').update(update).eq('id', cardId).select('id').maybeSingle()

  if (error || !data) {
    if (error) console.error('saveCard failed:', error.message)
    return { ok: false, message: 'We could not save your changes. Please try again, or contact the team if it keeps happening.', errors: {} }
  }

  revalidatePath('/dashboard')
  return { ok: true, message: 'Saved. Your card is updated.', errors: {} }
}
