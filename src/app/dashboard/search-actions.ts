'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SearchState } from './search-state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Saves the client's choice: may search engines list their card? Only this one column is touched.
export async function saveSearchChoice(_prev: SearchState, fd: FormData): Promise<SearchState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  const cardId = String(fd.get('card_id') ?? '')
  if (!UUID.test(cardId)) return { ok: false, message: 'Something went wrong. Please refresh the page.' }
  const allow = String(fd.get('allow') ?? '') === 'yes'

  // Row Level Security: this only finds the card if it belongs to this client.
  const { data, error } = await supabase
    .from('cards')
    .update({ allow_search_index: allow })
    .eq('id', cardId)
    .eq('owner_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('saveSearchChoice failed:', error.message)
    return { ok: false, message: 'This setting could not be saved. Please tell the team.' }
  }
  if (!data) return { ok: false, message: 'We could not find your card.' }

  revalidatePath('/dashboard')
  return {
    ok: true,
    message: allow
      ? 'Saved. Search engines may now list your card. It can take weeks, and no search engine promises to.'
      : 'Saved. Search engines are asked not to list your card. Pages already listed disappear over time.',
  }
}
