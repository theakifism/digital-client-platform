'use client'

import { useEffect } from 'react'

function send(slug: string, type: string) {
  const body = JSON.stringify({ slug, type })
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return
  } catch {
    // fall through to fetch
  }
  fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
}

// Counts one view per visit (viewType is 'view' on the card, 'site_view' on the small website)
// and a tap on any element marked with data-track="...".
export default function Tracker({ slug, viewType = 'view' }: { slug: string; viewType?: string }) {
  useEffect(() => {
    const key = `pc-viewed-${viewType}-${slug}`
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        send(slug, viewType)
      }
    } catch {
      send(slug, viewType)
    }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-track]')
      const type = el?.getAttribute('data-track')
      if (type) send(slug, type)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [slug, viewType])

  return null
}
