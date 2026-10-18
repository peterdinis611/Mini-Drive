import { ZodError } from 'zod'

/** Domain error with a stable, user-facing Slovak message. */
export class AppError extends Error {
  readonly code: string

  constructor(message: string, code = 'APP_ERROR') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

const MESSAGE_MAP: Array<[RegExp | string, string]> = [
  ['Unauthorized', 'Musíš byť prihlásený'],
  ['Failed to fetch', 'Server neodpovedá. Skontroluj pripojenie.'],
  [/network/i, 'Sieťová chyba. Skús to znova.'],
  [/timeout/i, 'Požiadavka vypršala. Skús to znova.'],
  [/UPLOADTHING_TOKEN/i, 'Úložisko nie je nakonfigurované (chýba token).'],
  [
    /ACL overrides are not allowed/i,
    'UploadThing nepovoľuje ACL override. Odstráň acl z route alebo to zapni v dashboarde.',
  ],
  [/XHR failed 400/i, 'Upload zlyhal (400). Skontroluj UploadThing nastavenia.'],
]

function mapKnownMessage(message: string): string {
  for (const [pattern, mapped] of MESSAGE_MAP) {
    if (typeof pattern === 'string') {
      if (message === pattern || message.includes(pattern)) return mapped
    } else if (pattern.test(message)) {
      return mapped
    }
  }
  return message
}

/** Extract a safe, user-facing message from unknown thrown values. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Niečo sa pokazilo',
): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof ZodError) {
    return formatZodError(error)
  }

  if (error instanceof Error) {
    const fromData = uploadThingDataMessage(error)
    if (fromData) return mapKnownMessage(fromData)

    const raw = error.message.trim()
    if (!raw) return fallback
    return mapKnownMessage(raw)
  }

  if (typeof error === 'string' && error.trim()) {
    return mapKnownMessage(error.trim())
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = Reflect.get(error, 'message')
    if (typeof message === 'string' && message.trim()) {
      return mapKnownMessage(message.trim())
    }
  }

  return fallback
}

/** UploadThing often puts the real reason on `error.data.error`. */
function uploadThingDataMessage(error: Error): string | null {
  const data = Reflect.get(error, 'data')
  if (!data || typeof data !== 'object') return null
  const nested = Reflect.get(data, 'error')
  return typeof nested === 'string' && nested.trim() ? nested.trim() : null
}

export function formatZodError(error: ZodError): string {
  return error.issues[0].message
}

export function firstZodFieldErrors(
  error: ZodError,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !out[key]) {
      out[key] = issue.message
    }
  }
  return out
}
