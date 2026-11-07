/**
 * App logging sink.
 * - DEV: forwards to console (only place in `src` allowed to touch it via Biome override).
 * - PROD: no-op — Vite also drops `console.*` and runtime mute covers deps.
 */

const isDev = import.meta.env.DEV

function write(
  method: 'debug' | 'info' | 'warn' | 'error',
  args: unknown[],
): void {
  if (!isDev) return
  console[method](...args)
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
}

/** Node / SSR boot messages that must survive without `console` (ops stderr). */
export function stderrLine(message: string): void {
  if (typeof process === 'undefined' || !process.stderr?.write) return
  process.stderr.write(`${message}\n`)
}
