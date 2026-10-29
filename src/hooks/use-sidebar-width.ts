'use client'

import {
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export const SIDEBAR_WIDTH_DEFAULT = 248
export const SIDEBAR_WIDTH_MIN = 200
export const SIDEBAR_WIDTH_MAX = 440

const STORAGE_KEY = 'mini-drive:sidebar-width'

function clampWidth(value: number) {
  return Math.min(
    SIDEBAR_WIDTH_MAX,
    Math.max(SIDEBAR_WIDTH_MIN, Math.round(value)),
  )
}

function readStoredWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_WIDTH_DEFAULT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return clampWidth(parsed)
  } catch {
    // ignore storage failures
  }
  return SIDEBAR_WIDTH_DEFAULT
}

export function useSidebarWidth() {
  const [width, setWidthState] = useState(SIDEBAR_WIDTH_DEFAULT)
  const [ready, setReady] = useState(false)
  const widthRef = useRef(width)
  widthRef.current = width

  useEffect(() => {
    setWidthState(readStoredWidth())
    setReady(true)
  }, [])

  const setWidth = useCallback((next: number | ((prev: number) => number)) => {
    setWidthState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      return clampWidth(value)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, String(width))
    } catch {
      // ignore storage failures
    }
  }, [ready, width])

  const resetWidth = useCallback(() => {
    setWidth(SIDEBAR_WIDTH_DEFAULT)
  }, [setWidth])

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.preventDefault()

      const handle = event.currentTarget
      const startX = event.clientX
      const startWidth = widthRef.current
      const pointerId = event.pointerId

      handle.setPointerCapture(pointerId)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      function onMove(moveEvent: PointerEvent) {
        setWidth(startWidth + (moveEvent.clientX - startX))
      }

      function onUp() {
        handle.releasePointerCapture(pointerId)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [setWidth],
  )

  const onResizeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const step = event.shiftKey ? 24 : 12
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setWidth((prev) => prev - step)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setWidth((prev) => prev + step)
      } else if (event.key === 'Home') {
        event.preventDefault()
        setWidth(SIDEBAR_WIDTH_MIN)
      } else if (event.key === 'End') {
        event.preventDefault()
        setWidth(SIDEBAR_WIDTH_MAX)
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        resetWidth()
      }
    },
    [resetWidth, setWidth],
  )

  return {
    width,
    setWidth,
    resetWidth,
    onResizePointerDown,
    onResizeKeyDown,
    min: SIDEBAR_WIDTH_MIN,
    max: SIDEBAR_WIDTH_MAX,
  }
}
