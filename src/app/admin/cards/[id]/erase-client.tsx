'use client'

import Link from 'next/link'
import { startTransition, useActionState } from 'react'
import { eraseClientAction } from '../../actions'
import { initialEraseState } from '../../state'

export default function EraseClient({ cardId, confirmWord, hasLogin }: { cardId: string; confirmWord: string; hasLogin: boolean }) {
  const [state, action, pending] = useActionState(eraseClientAction, initialEraseState)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (!window.confirm(hasLogin ? 'This permanently erases the client. It cannot be undone. Continue?' : 'This permanently deletes the card. Continue?')) return
    startTransition(() => action(fd))
  }

  if (state.ok) {
    return (
      <section className="adm-box">
        <p className="notice" role="status">{state.message}</p>
        <p><Link href="/admin/cards">Back to all cards</Link></p>
      </section>
    )
  }

  return (
    <section className="adm-box adm-danger">
      <h2>{hasLogin ? 'Erase this client' : 'Delete this card'}</h2>
      <p className="muted">
        {hasLogin
          ? 'Use this when a client leaves or asks us to delete their data. It permanently erases their login, all their cards, website sections, messages, activity numbers, feedback and photo files. It cannot be undone. Backups keep older copies until they expire (see the backup guide).'
          : 'This permanently deletes this card (it has no login), with its website sections, messages and activity numbers.'}
      </p>
      <form onSubmit={onSubmit}>
        <input type="hidden" name="card_id" value={cardId} />
        <label htmlFor="confirm">Type <strong>{confirmWord}</strong> to confirm</label>
        <input id="confirm" name="confirm" autoComplete="off" autoCapitalize="none" spellCheck={false} />
        <div style={{ marginTop: '0.75rem' }}>
          <button type="submit" className="adm-danger-btn" disabled={pending}>{pending ? 'Erasing…' : hasLogin ? 'Erase client' : 'Delete card'}</button>
        </div>
        {state.message && <p className="notice adm-error-box" role="alert" style={{ marginTop: '0.75rem' }}>{state.message}</p>}
      </form>
    </section>
  )
}
