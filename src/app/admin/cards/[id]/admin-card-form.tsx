'use client'

import { startTransition, useActionState } from 'react'
import { adminSaveCard } from '../../actions'
import { initialState } from '@/app/dashboard/state'
import { THEMES } from '@/app/dashboard/themes'
import { DEFAULT_ACCENTS, isHexAccent } from '@/lib/card-accent'

export type AdminEditableCard = {
  id: string
  slug: string
  name: string | null
  designation: string | null
  company: string | null
  bio: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  map_url: string | null
  website: string | null
  social_links: Record<string, string> | null
  theme: string
  accent_color: string | null
  organization_id?: string | null
}

const SOCIALS: [string, string][] = [
  ['instagram', 'Instagram'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
  ['youtube', 'YouTube'],
  ['x', 'X'],
]

export default function AdminCardForm({ card }: { card: AdminEditableCard }) {
  const [state, action, pending] = useActionState(adminSaveCard, initialState)
  const err = (k: string) => (state.errors[k] ? <p className="adm-error" role="alert">{state.errors[k]}</p> : null)
  const v = (x: string | null) => x ?? ''
  const storedAccent = card.accent_color ?? ''
  const initialAccent = isHexAccent(storedAccent) ? storedAccent : DEFAULT_ACCENTS[card.theme] ?? DEFAULT_ACCENTS.orion

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }

  return (
    <form onSubmit={onSubmit} className="adm-box" noValidate>
      <input type="hidden" name="card_id" value={card.id} />
      <div className="adm-grid">
        <div><label htmlFor="name">Name</label><input id="name" name="name" defaultValue={v(card.name)} maxLength={80} />{err('name')}</div>
        <div><label htmlFor="company">Business name</label><input id="company" name="company" defaultValue={v(card.company)} maxLength={80} />{err('company')}</div>
        <div><label htmlFor="designation">Role</label><input id="designation" name="designation" defaultValue={v(card.designation)} maxLength={80} />{err('designation')}</div>
        <div>
          <label htmlFor="theme">Card colours</label>
          <select id="theme" name="theme" defaultValue={THEMES.some((t) => t.id === card.theme) ? card.theme : 'light'}>
            {THEMES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
          </select>
          {err('theme')}
        </div>
        <div>
          <label htmlFor="accent_color">Accent color</label>
          <input
            id="accent_color"
            name="accent_color"
            type="color"
            defaultValue={initialAccent}
          />
          {err('accent_color')}
        </div>
        <div><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={v(card.phone)} maxLength={30} />{err('phone')}</div>
        <div><label htmlFor="whatsapp">WhatsApp number</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={v(card.whatsapp)} maxLength={30} />{err('whatsapp')}</div>
        <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={v(card.email)} maxLength={120} />{err('email')}</div>
        <div><label htmlFor="website">Website</label><input id="website" name="website" defaultValue={v(card.website)} maxLength={300} autoCapitalize="none" />{err('website')}</div>
        <div><label htmlFor="address">Address</label><input id="address" name="address" defaultValue={v(card.address)} maxLength={200} />{err('address')}</div>
        <div><label htmlFor="map_url">Google Maps link</label><input id="map_url" name="map_url" defaultValue={v(card.map_url)} maxLength={400} autoCapitalize="none" />{err('map_url')}</div>
        {SOCIALS.map(([key, label]) => (
          <div key={key}>
            <label htmlFor={`social_${key}`}>{label}</label>
            <input id={`social_${key}`} name={`social_${key}`} defaultValue={card.social_links?.[key] ?? ''} maxLength={300} autoCapitalize="none" />
            {err(`social_${key}`)}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <label htmlFor="bio">Short description</label>
        <textarea id="bio" name="bio" defaultValue={v(card.bio)} maxLength={500} rows={4} />
        {err('bio')}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</button>
        {state.message && (
          <p className={state.ok ? 'notice' : 'notice adm-error-box'} role="status" style={{ marginTop: '0.75rem' }}>{state.message}</p>
        )}
      </div>
    </form>
  )
}
