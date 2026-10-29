import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  consumeQueuedQuickAction,
  dispatchQuickAction,
  isQuickAction,
  onQuickAction,
  queueQuickAction,
  QUICK_ACTION_PENDING_KEY,
} from '#/lib/quick-actions'

describe('isQuickAction', () => {
  it('accepts known actions only', () => {
    expect(isQuickAction('search')).toBe(true)
    expect(isQuickAction('upload')).toBe(true)
    expect(isQuickAction('create-folder')).toBe(true)
    expect(isQuickAction('delete')).toBe(false)
    expect(isQuickAction(null)).toBe(false)
  })
})

describe('dispatchQuickAction / onQuickAction', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('notifies subscribers', () => {
    const handler = vi.fn()
    const off = onQuickAction(handler)
    dispatchQuickAction('upload')
    expect(handler).toHaveBeenCalledWith('upload')
    off()
    dispatchQuickAction('search')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('ignores malformed custom events', () => {
    const handler = vi.fn()
    const off = onQuickAction(handler)
    window.dispatchEvent(
      new CustomEvent('mini-drive:quick-action', { detail: { action: 'nope' } }),
    )
    expect(handler).not.toHaveBeenCalled()
    off()
  })
})

describe('queueQuickAction / consumeQueuedQuickAction', () => {
  afterEach(() => {
    window.sessionStorage.clear()
  })

  it('persists and consumes once', () => {
    const handler = vi.fn()
    const off = onQuickAction(handler)
    queueQuickAction('create-folder')
    expect(handler).toHaveBeenCalledWith('create-folder')
    expect(window.sessionStorage.getItem(QUICK_ACTION_PENDING_KEY)).toBe(
      'create-folder',
    )
    expect(consumeQueuedQuickAction()).toBe('create-folder')
    expect(consumeQueuedQuickAction()).toBeNull()
    off()
  })

  it('drops invalid stored values', () => {
    window.sessionStorage.setItem(QUICK_ACTION_PENDING_KEY, 'hack')
    expect(consumeQueuedQuickAction()).toBeNull()
  })
})
