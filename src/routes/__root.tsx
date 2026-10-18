import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { ThemeProvider } from '#/components/theme-provider'
import { Toaster } from '#/components/ui/sonner'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import { APP_NAME } from '#/lib/constants'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: `${APP_NAME} — osobné úložisko súborov`,
      },
      {
        name: 'description',
        content:
          'Mini Drive: súkromné úložisko súborov so safe-url zdieľaním.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

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
        <Scripts />
      </body>
    </html>
  )
}
