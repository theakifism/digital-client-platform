import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { findUnusedPhotos } from '@/lib/photo-admin'
import { storeName } from '@/lib/photo-store'
import { formatBytes } from '@/lib/rules'
import { deleteUnusedPhotos } from './actions'
import CleanButton from './clean-button'

type Props = { searchParams: Promise<{ result?: string; n?: string }> }

export default async function StoragePage({ searchParams }: Props) {
  const { supabase } = await requireAdmin()
  const { result, n } = await searchParams

  const unused = await findUnusedPhotos(createAdminClient(), supabase)
  if (!unused) {
    return (
      <main>
        <h1>Photo storage</h1>
        <p className="notice adm-error-box" role="alert">The list could not be worked out safely right now, so nothing is shown and nothing can be deleted. Please try again in a moment.</p>
      </main>
    )
  }

  const rows = unused.map((o) => ({ file_name: o.key, size_bytes: o.size, uploaded_at: o.lastModified.toISOString() }))
  const total = rows.reduce((s, r) => s + r.size_bytes, 0)

  return (
    <main>
      <h1>Photo storage</h1>
      <p className="muted">
        Photos kept in {storeName()} that are not used by any card or gallery any more, for example photos a client uploaded and
        never saved. Photos less than a day old are never listed.
      </p>

      {result === 'deleted' && <p className="notice" role="status">Deleted {Number(n) || 0} unused photo file(s).</p>}
      {result === 'none' && <p className="notice" role="status">There was nothing to delete.</p>}
      {result === 'error' && <p className="notice adm-error-box" role="alert">The clean-up did not work. Please try again.</p>}

      <section className="adm-box">
        <h2>{rows.length === 0 ? 'Nothing to clean up' : `${rows.length} unused file${rows.length === 1 ? '' : 's'}, ${formatBytes(total)}`}</h2>
        {rows.length > 0 && (
          <>
            <form action={deleteUnusedPhotos}>
              <CleanButton count={rows.length} />
            </form>
            <div className="adm-scroll" style={{ marginTop: '1rem' }}>
              <table className="adm-table">
                <thead><tr><th>File</th><th>Size</th><th>Uploaded</th></tr></thead>
                <tbody>
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.file_name}>
                      <td style={{ wordBreak: 'break-all' }}>{r.file_name}</td>
                      <td>{formatBytes(Number(r.size_bytes))}</td>
                      <td>{new Date(r.uploaded_at).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && <p className="muted">Showing the first 50 of {rows.length}.</p>}
          </>
        )}
      </section>
    </main>
  )
}
