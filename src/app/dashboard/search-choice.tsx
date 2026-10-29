'use client'

import { useActionState } from 'react'
import { saveSearchChoice } from './search-actions'
import { initialSearchState } from './search-state'

export default function SearchChoice({ cardId, initial }: { cardId: string; initial: boolean }) {
  const [state, action, pending] = useActionState(saveSearchChoice, initialSearchState)

  return (
    <section className="dash-section">
      <h2>Search engines</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        By default your card can only be found by people who have your link or QR code. If you switch this on, search engines such as
        Google may list your card and small website, and anyone can then find your name, business, photo, phone number and email through a search.
      </p>
      <form action={action}>
        <input type="hidden" name="card_id" value={cardId} />
        <div className="dash-row">
          <input id="allow" type="checkbox" name="allow" value="yes" defaultChecked={initial} style={{ width: '1.25rem', height: '1.25rem' }} />
          <label htmlFor="allow" style={{ margin: 0, fontWeight: 600 }}>Let search engines list my card and website</label>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        </div>
        {state.message && (
          <p className="notice" role="status" style={{ marginTop: '0.75rem' }}>{state.message}</p>
        )}
      </form>
    </section>
  )
}
