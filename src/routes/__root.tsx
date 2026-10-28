import { silenceClerkDevKeySpam } from '#/lib/clerk-dev-silence'

silenceClerkDevKeySpam()
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { NuqsAdapter } from 'nuqs/adapters/react'

import { ThemedClerkProvider } from '#/components/clerk-provider'
import { ThemeProvider } from '#/components/theme-provider'
import { ThemeSync } from '#/components/theme-sync'
import { AppErrorBoundary } from '#/components/error-boundary/app-error-boundary'
import { RouteError } from '#/components/error-boundary/route-error'
import { NotFoundPage, RoutePending } from '#/components/status/status-page'
import { Toaster } from '#/components/toast/toaster'
import { APP_NAME } from '#/lib/constants'
import { SITE } from '#/lib/site'
import { appJsonLd } from '#/lib/seo'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Great+Vibes&family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;600;700&display=swap'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => {
    // Document chrome only — page title/description/OG come from route heads
    // so we do not duplicate competing meta tags on every navigation.
    return {
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        {
          name: 'theme-color',
          content: SITE.themeColorLight,
          media: '(prefers-color-scheme: light)',
        },
        {
          name: 'theme-color',
          content: SITE.themeColorDark,
          media: '(prefers-color-scheme: dark)',
        },
        {
          name: 'color-scheme',
          content: 'light dark',
        },
        {
          name: 'format-detection',
          content: 'telephone=no',
        },
        {
          name: 'referrer',
          content: 'strict-origin-when-cross-origin',
        },
        { name: 'application-name', content: APP_NAME },
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
        { rel: 'preconnect', href: 'https://api.fontshare.com' },
        {
          rel: 'preconnect',
          href: 'https://cdn.fontshare.com',
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
      ],
      scripts: [appJsonLd()],
    }
  },
  component: RootComponent,
  pendingComponent: RoutePending,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
  shellComponent: RootDocument,
})

function RootComponent() {
  // React SPA adapter — TanStack Router adapter does not cover TanStack Start yet.
  // Pass the current search so SSR hooks match the request URL (no flash of defaults).
  const serverSearch = useRouterState({
    select: (s) => s.location.searchStr,
  })
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  return (
    <NuqsAdapter serverSearch={serverSearch}>
      <AppErrorBoundary variant="page" name="root-outlet" resetKeys={[pathname]}>
        <Outlet />
      </AppErrorBoundary>
    </NuqsAdapter>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh antialiased">
        <ThemeProvider>
          <ThemedClerkProvider>
            <ThemeSync />
            <a className="skip-to-content" href="#main-content">
              Preskočiť na obsah
            </a>
            <AppErrorBoundary variant="page" name="shell">
              {children}
            </AppErrorBoundary>
            <Toaster />
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
          </ThemedClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
