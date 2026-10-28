import { ServerErrorPage } from '#/components/status/status-page'
import { reportError, toError } from '#/lib/errors'

type Props = {
  error: unknown
  reset: () => void
}

/** Shared TanStack Router `errorComponent` / `defaultErrorComponent`. */
export function RouteError({ error, reset }: Props) {
  const normalized = toError(error)
  reportError(normalized, 'route')
  return <ServerErrorPage error={normalized} reset={reset} />
}
