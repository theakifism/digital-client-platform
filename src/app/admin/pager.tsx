import Link from 'next/link'

// "Previous / Next" links that keep the search and filter in the address.
export default function Pager({ basePath, params, page, total, pageSize }: {
  basePath: string
  params: Record<string, string>
  page: number
  total: number
  pageSize: number
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const href = (p: number) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v) })
    if (p > 1) q.set('page', String(p))
    const s = q.toString()
    return s ? `${basePath}?${s}` : basePath
  }
  return (
    <nav className="adm-row adm-pager" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span className="muted">Previous</span>}
      <span>Page {page} of {pages} ({total} in total)</span>
      {page < pages ? <Link href={href(page + 1)}>Next</Link> : <span className="muted">Next</span>}
    </nav>
  )
}
