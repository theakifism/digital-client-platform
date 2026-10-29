'use client'

import { useActionState } from 'react'
import { updateLead } from './lead-actions'
import { initialFollowupState } from './followup-state'
import { LEAD_LABELS, LEAD_STATUSES, NOTE_MAX, type LeadStatus } from '@/lib/lead-status'

// The status list and private note under one message. Saving never changes what the visitor wrote.
export default function LeadFollowup({ id, status, note }: { id: string; status: LeadStatus; note: string | null }) {
  const [state, action, pending] = useActionState(updateLead, initialFollowupState)
  const statusId = `status-${id}`
  const noteId = `note-${id}`

  return (
    <form action={action} className="lead-follow">
      <input type="hidden" name="lead_id" value={id} />
      <div className="dash-grid two">
        <div>
          <label htmlFor={statusId}>Status</label>
          <select id={statusId} name="status" defaultValue={status} className="lead-select">
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>{LEAD_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={noteId}>Private note (only you see this)</label>
          <textarea id={noteId} name="note" rows={2} maxLength={NOTE_MAX} defaultValue={note ?? ''} placeholder="Example: called on Monday, wants a quote" />
        </div>
      </div>
      <div className="dash-row" style={{ marginTop: '0.5rem' }}>
        <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        {state.message && (
          <span role="status" className={state.ok ? 'muted' : 'dash-error'}>{state.message}</span>
        )}
      </div>
    </form>
  )
}
