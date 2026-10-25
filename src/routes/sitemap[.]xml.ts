import { createFileRoute } from '@tanstack/react-router'

import { PUBLIC_PATHS } from '#/lib/site'

function getSiteUrl() {
  const raw =
    process.env.APP_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl = getSiteUrl()
        const lastmod = new Date().toISOString().slice(0, 10)

        const urls = PUBLIC_PATHS.map((path) => {
          const loc = path === '/' ? siteUrl : `${siteUrl}${path}`
          const priority =
            path === '/' ? '1.0' : path === '/register' ? '0.9' : '0.8'
          const changefreq = path === '/' ? 'weekly' : 'monthly'
          return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
        }).join('\n')

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control':
              process.env.NODE_ENV === 'production'
                ? 'public, max-age=3600'
                : 'no-store',
          },
        })
      },
    },
  },
})
