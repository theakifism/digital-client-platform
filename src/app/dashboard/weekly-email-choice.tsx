'use client'

import { useActionState } from 'react'
import { saveWeeklyEmail } from './weekly-actions'
import { initialWeeklyState } from './weekly-state'

export default function WeeklyEmailChoice({ cardId, initial, email }: { cardId: string; initial: boolean; email: string | null }) {
  const [state, action, pending] = useActionState(saveWeeklyEmail, initialWeeklyState)
  const hasEmail = !!(email && email.trim())

  return (
    <section className="dash-section">
      <h2>Weekly e-mail</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Every Monday morning we can e-mail you a short summary of your card: views, taps, saved contacts and new messages.
        It contains numbers only, never what visitors wrote.
        {hasEmail ? ` It goes to ${email}.` : ' To use it, first add your e-mail address to your card above.'}
      </p>
      <form action={action}>
        <input type="hidden" name="card_id" value={cardId} />
        <div className="dash-row">
          <input id="weekly" type="checkbox" name="weekly" value="yes" defaultChecked={initial} style={{ width: '1.25rem', height: '1.25rem' }} />
          <label htmlFor="weekly" style={{ margin: 0, fontWeight: 600 }}>Send me my weekly card numbers by e-mail</label>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        </div>
        {state.message && <p className="notice" role="status" style={{ marginTop: '0.75rem' }}>{state.message}</p>}
      </form>
    </section>
  )
}
