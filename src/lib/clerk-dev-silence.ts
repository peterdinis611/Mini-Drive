/**
 * Vite RSC/SSR forwards console.* between client and server.
 * Clerk development/telemetry noise then nests infinitely and OOMs the process.
 *
 * In production we mute the entire console API instead.
 */
import { muteConsoleInProduction } from '#/lib/mute-console'

const MARKERS = [
  'Clerk has been loaded with development keys',
  'Clerk collects telemetry data',
  'To learn more, including how to opt-out from the telemetry',
] as const

let patched = false

function isClerkSpam(args: unknown[]) {
  return args.some(
    (arg) =>
      typeof arg === 'string' && MARKERS.some((marker) => arg.includes(marker)),
  )
}

export function silenceClerkDevKeySpam() {
  if (import.meta.env.PROD === true || process.env.NODE_ENV === 'production') {
    muteConsoleInProduction()
    return
  }

  if (patched) return
  patched = true

  const warn = console.warn.bind(console)
  const info = console.info.bind(console)
  const log = console.log.bind(console)

  console.warn = (...args: unknown[]) => {
    if (isClerkSpam(args)) return
    warn(...args)
  }
  console.info = (...args: unknown[]) => {
    if (isClerkSpam(args)) return
    info(...args)
  }
  console.log = (...args: unknown[]) => {
    if (isClerkSpam(args)) return
    log(...args)
  }
}
