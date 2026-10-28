'use client'

import type { ReactNode } from 'react'
import {
  ErrorBoundary,
  type ErrorBoundaryProps,
  type FallbackProps,
} from 'react-error-boundary'

import { SectionErrorFallback } from '#/components/error-boundary/section-error-fallback'
import { ServerErrorPage } from '#/components/status/status-page'
import { reportError, toError } from '#/lib/errors'

type Variant = 'page' | 'section'

type Props = {
  children: ReactNode
  /** page = full status screen; section = inline card */
  variant?: Variant
  /** Optional label for logs / DEV console */
  name?: string
  /** Reset when these values change (e.g. route id, file id) */
  resetKeys?: ErrorBoundaryProps['resetKeys']
  /** Override section title */
  sectionTitle?: string
  compact?: boolean
  onReset?: ErrorBoundaryProps['onReset']
  className?: string
}

function PageFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ServerErrorPage error={toError(error)} reset={resetErrorBoundary} />
  )
}

/**
 * App-wide wrapper around `react-error-boundary` with Slovak fallbacks
 * and DEV reporting. Use `variant="page"` near the root and
 * `variant="section"` around risky islands (preview, explorer panels).
 */
export function AppErrorBoundary({
  children,
  variant = 'section',
  name = 'ui',
  resetKeys,
  sectionTitle,
  compact,
  onReset,
  className,
}: Props) {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onReset={onReset}
      onError={(error, info) => {
        reportError(error, name, {
          componentStack: info.componentStack,
        })
      }}
      fallbackRender={
        variant === 'page'
          ? PageFallback
          : ({ error, resetErrorBoundary }) => (
              <SectionErrorFallback
                error={error}
                resetErrorBoundary={resetErrorBoundary}
                title={sectionTitle}
                compact={compact}
                className={className}
              />
            )
      }
    >
      {children}
    </ErrorBoundary>
  )
}
