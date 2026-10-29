'use client'

import { useEffect, useState } from 'react'

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [canShare, setCanShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }

  async function share() {
    try {
      await navigator.share({ title, url })
    } catch {
      // The person closed the share sheet. Nothing to do.
    }
  }

  return (
    <div className="pc-share-buttons">
      <button type="button" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
      {canShare && <button type="button" onClick={share}>Share</button>}
    </div>
  )
}
