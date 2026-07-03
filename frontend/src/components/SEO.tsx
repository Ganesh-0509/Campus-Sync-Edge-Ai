import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: string
  /** @deprecated Google ignores the keywords meta tag; accepted for back-compat but no longer rendered. */
  keywords?: string
  /** Emit `<meta name="robots" content="noindex, follow">` — use on 404 and other non-indexable pages. */
  noindex?: boolean
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = '/og-image.png',
  ogType = 'website',
  noindex = false,
}: SEOProps) {
  const fullTitle = title.includes('Jobyn') ? title : `${title} — Jobyn`
  const canonicalUrl = canonical || `https://getjobyn.pages.dev${window.location.pathname}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}
