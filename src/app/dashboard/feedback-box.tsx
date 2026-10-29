'use client'

import { startTransition, useActionState, useState } from 'react'
import { sendFeedback } from './feedback-actions'
import { initialFeedbackState } from './feedback-state'

export default function FeedbackBox() {
  const [state, action, pending] = useActionState(sendFeedback, initialFeedbackState)
  const [formKey, setFormKey] = useState(0)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <section className="dash-section">
      <h2>Tell us what you think</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        What was easy, what confused you, what is missing? Your words go straight to the team.
      </p>

      {state.ok ? (
        <>
          <p className="notice" role="status">{state.message}</p>
          <button type="button" className="secondary" style={{ marginTop: '0.75rem' }} onClick={() => { setFormKey((k) => k + 1) }}>
            Send more feedback
          </button>
        </>
      ) : (
        <form key={formKey} onSubmit={onSubmit} noValidate>
          <fieldset className="dash-themes">
            <legend className="muted">How is it going so far? (optional)</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n}>
                <input type="radio" name="rating" value={n} />
                {n}{n === 1 ? ' (poor)' : n === 5 ? ' (great)' : ''}
              </label>
            ))}
          </fieldset>
          <label htmlFor="fb-message" style={{ display: 'block', fontWeight: 600, margin: '0.75rem 0 0.25rem' }}>Your message</label>
          <textarea
            id="fb-message" name="message" rows={4} maxLength={1000}
            style={{ width: '100%', padding: '0.75rem', font: 'inherit', color: 'inherit', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
          />
          <div style={{ marginTop: '0.75rem' }}>
            <button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send feedback'}</button>
            {state.message && !state.ok && <p className="notice dash-error-box" role="alert" style={{ marginTop: '0.75rem' }}>{state.message}</p>}
          </div>
        </form>
      )}
    </section>
  )
}
