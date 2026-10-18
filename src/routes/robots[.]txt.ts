import { createFileRoute } from '@tanstack/react-router'

import { DISALLOW_PATHS, PUBLIC_PATHS } from '#/lib/site'

function getSiteUrl() {
  const raw =
    process.env.APP_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const siteUrl = getSiteUrl()
        const lines = [
          'User-agent: *',
          ...PUBLIC_PATHS.map((path) => `Allow: ${path}`),
          ...DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
          '',
          `Sitemap: ${siteUrl}/sitemap.xml`,
          '',
        ]

        return new Response(lines.join('\n'), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
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
