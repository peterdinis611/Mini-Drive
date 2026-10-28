export type ThemePreference = 'light' | 'dark' | 'system'

const SYNC_PREFIX = 'mini-drive:theme-synced:'

export function themeSyncStorageKey(userId: string) {
  return `${SYNC_PREFIX}${userId}`
}

/** True when this tab already applied DB theme (or user overrode it). */
export function hasThemeSynced(userId: string): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(themeSyncStorageKey(userId)) === '1'
  } catch {
    return false
  }
}

/**
 * Mark theme as settled for this signed-in user in this tab.
 * Prevents ThemeSync from overwriting a fresher local choice.
 */
export function markThemeSynced(userId: string) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(themeSyncStorageKey(userId), '1')
  } catch {
    // private mode / quota
  }
}

export function clearThemeSynced(userId: string) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(themeSyncStorageKey(userId))
  } catch {
    // ignore
  }
}
