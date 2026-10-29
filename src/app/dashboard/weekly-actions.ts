'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WeeklyState } from './weekly-state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Saves the client's choice: do they want the weekly numbers e-mail? Only this one column is touched.
export async function saveWeeklyEmail(_prev: WeeklyState, fd: FormData): Promise<WeeklyState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  const cardId = String(fd.get('card_id') ?? '')
  if (!UUID.test(cardId)) return { ok: false, message: 'Something went wrong. Please refresh the page.' }
  const want = String(fd.get('weekly') ?? '') === 'yes'

  // Row Level Security: this only finds the card if it belongs to this client.
  const { data: card } = await supabase.from('cards').select('email').eq('id', cardId).eq('owner_id', user.id).maybeSingle()
  if (!card) return { ok: false, message: 'We could not find your card.' }
  if (want && !(card.email || '').trim()) return { ok: false, message: 'Please add your e-mail address to your card first, then switch this on.' }

  const { data, error } = await supabase.from('cards').update({ weekly_email: want }).eq('id', cardId).eq('owner_id', user.id).select('id').maybeSingle()
  if (error) {
    console.error('saveWeeklyEmail failed:', error.message)
    return { ok: false, message: 'This setting could not be saved. Please tell the team.' }
  }
  if (!data) return { ok: false, message: 'We could not find your card.' }

  revalidatePath('/dashboard')
  return {
    ok: true,
    message: want
      ? 'Saved. Every Monday morning you will get a short e-mail with your card numbers.'
      : 'Saved. You will not get the weekly e-mail.',
  }
}
