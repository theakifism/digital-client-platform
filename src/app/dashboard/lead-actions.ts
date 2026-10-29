'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { cleanNote, isLeadStatus } from '@/lib/lead-status'
import type { FollowupState } from './followup-state'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Runs as the logged-in client, so the database only lets them delete messages sent to THEIR OWN cards.
export async function deleteLead(fd: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const id = String(fd.get('lead_id') ?? '')
  if (!UUID.test(id)) return
  await supabase.from('leads').delete().eq('id', id)
  revalidatePath('/dashboard')
}

// Milestone 14: save the follow-up status and the private note of one message.
// Only these two columns are ever sent. Row Level Security and a column-level permission (migration 011)
// mean a client can only change them on messages sent to THEIR OWN cards, and nothing else on the message.
export async function updateLead(_prev: FollowupState, fd: FormData): Promise<FollowupState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  const id = String(fd.get('lead_id') ?? '')
  if (!UUID.test(id)) return { ok: false, message: 'Something went wrong. Please refresh the page.' }

  const status = String(fd.get('status') ?? '')
  if (!isLeadStatus(status)) return { ok: false, message: 'Please choose a status from the list.' }

  const cleaned = cleanNote(String(fd.get('note') ?? ''))
  if (cleaned.error) return { ok: false, message: cleaned.error }

  const { data, error } = await supabase.from('leads').update({ status, note: cleaned.note }).eq('id', id).select('id').maybeSingle()
  if (error) {
    console.error('updateLead failed:', error.message)
    return { ok: false, message: 'This could not be saved. Please tell the team.' }
  }
  if (!data) return { ok: false, message: 'We could not find this message. It may have been deleted.' }

  revalidatePath('/dashboard')
  return { ok: true, message: 'Saved.' }
}
