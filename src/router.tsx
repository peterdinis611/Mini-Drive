import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { RouteError } from '#/components/error-boundary/route-error'
import { NotFoundPage, RoutePending } from '#/components/status/status-page'
import { getContext } from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 60_000,
    defaultPendingMs: 120,
    defaultPendingMinMs: 250,
    defaultPendingComponent: RoutePending,
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: RouteError,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
