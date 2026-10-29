'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUnusedPhotos } from '@/lib/photo-admin'
import { storeDelete } from '@/lib/photo-store'

// Deletes photo files that no card and no gallery uses (and that are over a day old).
// The list is worked out again here on the server, so nothing can be added to it from the page.
export async function deleteUnusedPhotos(): Promise<void> {
  const { supabase } = await requireAdmin()

  const unused = await findUnusedPhotos(createAdminClient(), supabase)
  if (!unused) redirect('/admin/storage?result=error')
  if (unused.length === 0) redirect('/admin/storage?result=none')

  const removed = await storeDelete(unused.slice(0, 200).map((o) => o.key))

  revalidatePath('/admin/storage')
  redirect(`/admin/storage?result=deleted&n=${removed}`)
}
