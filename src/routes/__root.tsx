import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { ThemeProvider } from '#/components/theme-provider'
import {
  NotFoundPage,
  RoutePending,
  ServerErrorPage,
} from '#/components/status/status-page'
import { Toaster } from '#/components/ui/sonner'
import { APP_NAME } from '#/lib/constants'
import { SITE } from '#/lib/site'
import { appJsonLd, buildSeoHead } from '#/lib/seo'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Literata:opsz,wght@7..72,500;7..72,600&display=swap'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    const defaultSeo = buildSeoHead({
      title: `${APP_NAME} — ${SITE.tagline}`,
      description: SITE.description,
      path: '/',
      brandSuffix: false,
    })

    return {
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          name: 'theme-color',
          content: '#2383e2',
        },
        {
          name: 'color-scheme',
          content: 'light dark',
        },
        {
          name: 'format-detection',
          content: 'telephone=no',
        },
        ...defaultSeo.meta,
      ],
      links: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossOrigin: 'anonymous',
        },
        {
          rel: 'preload',
          as: 'style',
          href: FONT_STYLESHEET,
        },
        {
          rel: 'stylesheet',
          href: FONT_STYLESHEET,
        },
        {
          rel: 'stylesheet',
          href: appCss,
        },
        ...defaultSeo.links,
      ],
      scripts: [appJsonLd()],
    }
  },
  component: RootComponent,
  pendingComponent: RoutePending,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ error, reset }) => (
    <ServerErrorPage
      error={error instanceof Error ? error : new Error('Neznáma chyba')}
      reset={reset}
    />
  ),
  shellComponent: RootDocument,
})

function RootComponent() {
  return <Outlet />
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
