/**
 * App logging sink.
 * - DEV: forwards to console (Biome override allows console here only).
 * - PROD: warn/error go to stderr so ops still see failures; debug/info stay quiet.
 */

const isDev = import.meta.env.DEV

/** Node / SSR messages that must survive without `console`. */
export function stderrLine(message: string): void {
  if (typeof process === 'undefined' || !process.stderr?.write) return
  process.stderr.write(`${message}\n`)
}

function formatArg(arg: unknown): string {
  if (arg instanceof Error) {
    return arg.stack ?? arg.message
  }
  if (typeof arg === 'string') return arg
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

function write(
  method: 'debug' | 'info' | 'warn' | 'error',
  args: unknown[],
): void {
  if (isDev) {
    console[method](...args)
    return
  }
  if (method === 'warn' || method === 'error') {
    const prefix = method === 'error' ? '[error]' : '[warn]'
    stderrLine(`${prefix} ${args.map(formatArg).join(' ')}`)
  }
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
}
