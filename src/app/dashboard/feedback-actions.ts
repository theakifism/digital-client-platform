'use server'

import { createClient } from '@/lib/supabase/server'
import type { FeedbackState } from './feedback-state'

export async function sendFeedback(_prev: FeedbackState, fd: FormData): Promise<FeedbackState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  const message = String(fd.get('message') ?? '').replace(/\r\n/g, '\n').trim()
  const ratingRaw = parseInt(String(fd.get('rating') ?? ''), 10)
  const rating = ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null

  if (!message) return { ok: false, message: 'Please write a few words first.' }
  if (message.length > 1000) return { ok: false, message: 'That is too long. Please keep it under 1000 characters.' }

  // A gentle limit: 5 messages a day per person.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', since)
  if ((count ?? 0) >= 5) return { ok: false, message: 'You have sent a lot of feedback today. Thank you! Please try again tomorrow.' }

  // Runs as the logged-in client: the database only lets them write feedback as themselves.
  const { error } = await supabase.from('feedback').insert({ owner_id: user.id, rating, message })
  if (error) {
    console.error('feedback failed:', error.message)
    return { ok: false, message: 'Sorry, we could not send your feedback. Please try again.' }
  }
  return { ok: true, message: 'Thank you! Your feedback has been sent to the team.' }
}
