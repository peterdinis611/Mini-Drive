import { afterEach, describe, expect, it, vi } from 'vitest'

import { dismiss, getToasts, subscribe, toast } from './toast'

describe('toast', () => {
  afterEach(() => {
    dismiss()
    vi.useRealTimers()
  })

  it('pushes success and notifies subscribers', () => {
    const spy = vi.fn()
    const unsub = subscribe(spy)
    toast.success('Hotovo')
    expect(getToasts()[0]?.tone).toBe('success')
    expect(getToasts()[0]?.title).toBe('Hotovo')
    expect(spy).toHaveBeenCalled()
    unsub()
  })

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers()
    toast.error('Chyba', { duration: 1000 })
    expect(getToasts()).toHaveLength(1)
    vi.advanceTimersByTime(1000)
    expect(getToasts()).toHaveLength(0)
  })

  it('keeps at most 4 toasts', () => {
    for (let i = 0; i < 6; i++) toast.message(`m${i}`, { duration: 0 })
    expect(getToasts()).toHaveLength(4)
    expect(getToasts()[0]?.title).toBe('m5')
  })
})
