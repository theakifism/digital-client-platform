'use client'

import { useRef, useState } from 'react'
import { bulkCreateChunk } from '../../actions'
import { BULK_CHUNK, BULK_MAX_ROWS, type BulkInput, type BulkRow } from '../../state'
import { csvToRecords, parseCsv, toCsv } from '@/lib/csv'

// The browser reads the file and sends the clients to the server in small groups.
// So no single request runs long, and you see the result of each client as soon as it is done.
export default function BulkForm() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<BulkRow[]>([])
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return setMessage({ ok: false, text: 'Please choose a CSV file.' })
    if (file.size > 1024 * 1024) return setMessage({ ok: false, text: 'That file is too big (over 1 MB).' })

    const { headers, records } = csvToRecords(parseCsv(await file.text()))
    const missing = ['username', 'slug', 'name'].filter((h) => !headers.includes(h))
    if (missing.length > 0) {
      return setMessage({ ok: false, text: `The first row must contain these column names: username, slug, name. Missing: ${missing.join(', ')}.` })
    }
    if (records.length === 0) return setMessage({ ok: false, text: 'The file has no client rows.' })
    if (records.length > BULK_MAX_ROWS) {
      return setMessage({ ok: false, text: `Please upload at most ${BULK_MAX_ROWS} clients at a time (this file has ${records.length}).` })
    }

    const results: BulkRow[] = []
    const todo: BulkInput[] = []
    const seenUsers = new Set<string>()
    const seenSlugs = new Set<string>()
    for (const { line, values } of records) {
      const username = (values.username || '').toLowerCase()
      const slug = (values.slug || values.username || '').toLowerCase()
      if (seenUsers.has(username)) { results.push({ line, username, slug, status: 'error', error: 'This username appears twice in the file.' }); continue }
      if (seenSlugs.has(slug)) { results.push({ line, username, slug, status: 'error', error: 'This card link appears twice in the file.' }); continue }
      seenUsers.add(username)
      seenSlugs.add(slug)
      todo.push({
        line, username, slug, name: values.name || '', company: values.company, designation: values.designation,
        phone: values.phone, email: values.email, theme: values.theme,
      })
    }

    setBusy(true)
    setMessage(null)
    setRows([...results])
    for (let i = 0; i < todo.length; i += BULK_CHUNK) {
      const chunk = todo.slice(i, i + BULK_CHUNK)
      setProgress(`Creating clients… ${Math.min(i + BULK_CHUNK, todo.length)} of ${todo.length}`)
      try {
        results.push(...(await bulkCreateChunk(chunk)))
      } catch {
        chunk.forEach((c) =>
          results.push({
            line: c.line, username: c.username, slug: c.slug, status: 'error',
            error: 'The server did not answer. This client may or may not have been created. Check the Cards list before you try again.',
          })
        )
      }
      setRows([...results].sort((a, b) => a.line - b.line))
    }
    setProgress('')
    setBusy(false)
    const created = results.filter((r) => r.status === 'created').length
    setMessage({ ok: created > 0, text: `${created} of ${records.length} clients created.` })
  }

  function downloadCredentials() {
    const origin = window.location.origin
    const out = [['username', 'password', 'card_link', 'login_link']]
    rows
      .filter((r) => r.status === 'created')
      .forEach((r) => out.push([r.username, r.password ?? '', `${origin}/${r.slug}`, `${origin}/login`]))
    const url = URL.createObjectURL(new Blob([toCsv(out)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'client-logins.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const anyCreated = rows.some((r) => r.status === 'created')

  return (
    <section className="adm-box">
      <form onSubmit={onSubmit}>
        <label htmlFor="file">CSV file</label>
        <input id="file" ref={fileRef} name="file" type="file" accept=".csv,text/csv" required />
        <div style={{ marginTop: '0.75rem' }}>
          <button type="submit" disabled={busy}>{busy ? progress || 'Creating clients… please wait' : 'Create clients'}</button>
        </div>
      </form>
      {busy && <p className="muted" role="status">Keep this page open until it finishes.</p>}

      {message && <p className={message.ok ? 'notice' : 'notice adm-error-box'} role="status" style={{ marginTop: '1rem' }}>{message.text}</p>}

      {rows.length > 0 && (
        <>
          {anyCreated && (
            <div style={{ marginTop: '1rem' }}>
              <p className="notice">Passwords are shown only now. Download the file and keep it safe, then delete it after you have sent the logins. Each client must choose their own password at the first login.</p>
              <button type="button" onClick={downloadCredentials} style={{ marginTop: '0.75rem' }}>Download logins (CSV)</button>
            </div>
          )}
          <div className="adm-scroll" style={{ marginTop: '1rem' }}>
            <table className="adm-table">
              <thead><tr><th>#</th><th>Username</th><th>Card link</th><th>Result</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.line}-${r.username}`}>
                    <td>{r.line}</td>
                    <td>{r.username}</td>
                    <td>/{r.slug}</td>
                    <td>{r.status === 'created' ? <span className="adm-badge adm-on">Created</span> : <span className="adm-error">{r.error}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
