/**
 * Persisted custom hotkey bindings (opaque JSON map).
 * Shape is enforced by @tanstack/react-hotkeys when applied — storage stays untyped.
 */
export type StoredCustomHotkeys = Record<string, unknown>

export const HOTKEYS_STORAGE_KEY = 'mini-drive:custom-hotkeys'

export function loadCustomHotkeys(): StoredCustomHotkeys {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(HOTKEYS_STORAGE_KEY)
    if (!raw) return {}
    return parseCustomHotkeys(raw)
  } catch {
    return {}
  }
}

export function saveCustomHotkeys(custom: StoredCustomHotkeys) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HOTKEYS_STORAGE_KEY, JSON.stringify(custom))
  } catch {
    // ignore quota / private mode
  }
}

export function parseCustomHotkeys(
  raw: string | null | undefined,
): StoredCustomHotkeys {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as StoredCustomHotkeys
  } catch {
    return {}
  }
}

export function serializeCustomHotkeys(custom: StoredCustomHotkeys): string {
  return JSON.stringify(custom)
}
