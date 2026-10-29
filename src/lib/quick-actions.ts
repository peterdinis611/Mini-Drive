export const QUICK_ACTION_EVENT = 'mini-drive:quick-action'
export const QUICK_ACTION_PENDING_KEY = 'mini-drive:pending-quick-action'

export type QuickAction = 'search' | 'upload' | 'create-folder'

type QuickActionDetail = { action: QuickAction }

export function isQuickAction(value: unknown): value is QuickAction {
  return value === 'search' || value === 'upload' || value === 'create-folder'
}

/** Fire a quick action for any mounted listener (search host, file explorer…). */
export function dispatchQuickAction(action: QuickAction) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<QuickActionDetail>(QUICK_ACTION_EVENT, {
      detail: { action },
    }),
  )
}

/**
 * Persist an action across a navigation (e.g. FAB → /files then open dialog).
 * Consumed once by the target screen.
 */
export function queueQuickAction(action: QuickAction) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(QUICK_ACTION_PENDING_KEY, action)
  } catch {
    // ignore quota / private mode
  }
  dispatchQuickAction(action)
}

export function consumeQueuedQuickAction(): QuickAction | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(QUICK_ACTION_PENDING_KEY)
    window.sessionStorage.removeItem(QUICK_ACTION_PENDING_KEY)
    return isQuickAction(raw) ? raw : null
  } catch {
    return null
  }
}

export function onQuickAction(
  handler: (action: QuickAction) => void,
): () => void {
  function listener(event: Event) {
    const detail = (event as CustomEvent<QuickActionDetail>).detail
    if (detail && isQuickAction(detail.action)) handler(detail.action)
  }
  window.addEventListener(QUICK_ACTION_EVENT, listener)
  return () => window.removeEventListener(QUICK_ACTION_EVENT, listener)
}
