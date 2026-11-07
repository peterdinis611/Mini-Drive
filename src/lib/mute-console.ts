/**
 * Disable browser/Node console APIs in production so third-party noise
 * (and any surviving `console.*`) cannot leak to users or logs.
 */

let muted = false

const NOOP = () => {}

function isProductionRuntime(): boolean {
  return import.meta.env.PROD === true || process.env.NODE_ENV === 'production'
}

export function muteConsoleInProduction(): void {
  if (muted) return
  if (!isProductionRuntime()) return
  muted = true

  console.debug = NOOP
  console.log = NOOP
  console.info = NOOP
  console.warn = NOOP
  console.error = NOOP
  console.trace = NOOP
  console.dir = NOOP
  console.table = NOOP
  console.group = NOOP
  console.groupCollapsed = NOOP
  console.groupEnd = NOOP
}
