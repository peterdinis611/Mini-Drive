import { QueryClient } from '@tanstack/react-query'

import { reportError } from '#/lib/errors'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  })

  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.query.state.status === 'error') {
      reportError(event.query.state.error, `query:${String(event.query.queryHash)}`)
    }
  })

  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.mutation.state.status === 'error') {
      reportError(event.mutation.state.error, 'mutation')
    }
  })

  return {
    queryClient,
  }
}
export default function TanstackQueryProvider() {}
