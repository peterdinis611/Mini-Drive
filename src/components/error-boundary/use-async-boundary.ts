'use client'

import { useErrorBoundary } from 'react-error-boundary'

import { reportError } from '#/lib/errors'

/**
 * Push async / event-handler failures into the nearest `AppErrorBoundary`.
 * React only auto-catches render errors; use this for loaders started from effects.
 */
export function useAsyncBoundary(context = 'async') {
  const { showBoundary, resetBoundary } = useErrorBoundary()

  return {
    resetBoundary,
    showBoundary,
    capture(error: unknown) {
      reportError(error, context)
      showBoundary(error)
    },
  }
}
