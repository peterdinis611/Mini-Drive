import type { CustomHotkeys } from '@tanstack/react-hotkeys'

export const HOTKEYS_STORAGE_KEY = 'mini-drive:custom-hotkeys'

export function loadCustomHotkeys(): CustomHotkeys {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(HOTKEYS_STORAGE_KEY)
    if (!raw) return {}
    return parseCustomHotkeys(raw)
  } catch {
    return {}
  }
}

export function saveCustomHotkeys(custom: CustomHotkeys) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HOTKEYS_STORAGE_KEY, JSON.stringify(custom))
  } catch {
    // ignore quota / private mode
  }
}

export function parseCustomHotkeys(
  raw: string | null | undefined,
): CustomHotkeys {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as CustomHotkeys
  } catch {
    return {}
  }
}

export function serializeCustomHotkeys(custom: CustomHotkeys): string {
  return JSON.stringify(custom)
}
