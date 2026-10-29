import { QueryClient } from '@tanstack/react-query'

import { reportError } from '#/lib/errors'

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Drive chrome / folder listings change via explicit invalidate().
        staleTime: 60_000,
        gcTime: 15 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
        // Avoid stampedes when many components mount the same query.
        networkMode: 'online',
      },
      mutations: {
        retry: 0,
        networkMode: 'online',
      },
    },
  })

  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.query.state.status === 'error') {
      reportError(
        event.query.state.error,
        `query:${String(event.query.queryHash)}`,
      )
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
