import type { MetadataRoute } from 'next'
import { listIndexableCards, siteUrl } from '@/lib/card'

// Lists the public pages for search engines: the home page, the request form, and ONLY the cards whose owners said yes.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const cards = await listIndexableCards()
  return [
    { url: base, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.5 },
    ...cards.map((c) => ({
      url: `${base}/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
