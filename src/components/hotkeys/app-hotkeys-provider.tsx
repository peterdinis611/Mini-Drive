'use client'

import type { CustomHotkeys } from '@tanstack/react-hotkeys'
import { HotkeysProvider } from '@tanstack/react-hotkeys'
import { useEffect, useRef, useState } from 'react'

import { appHotkeys } from '#/lib/app-hotkeys'
import {
  loadCustomHotkeys,
  parseCustomHotkeys,
  saveCustomHotkeys,
  serializeCustomHotkeys,
} from '#/lib/hotkeys-storage'
import { getCustomHotkeys, updateSettings } from '#/server/functions/settings'

type Props = {
  children: React.ReactNode
}

/**
 * Provides app hotkeys. Hydrates from localStorage first, then account
 * (`user.custom_hotkeys`) when signed in. Changes sync to both.
 */
export function AppHotkeysProvider({ children }: Props) {
  const [bootKey, setBootKey] = useState(0)
  const [customHotkeys, setCustomHotkeys] = useState<CustomHotkeys>({})
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accountLoaded = useRef(false)

  useEffect(() => {
    setCustomHotkeys(loadCustomHotkeys())
    setBootKey(1)

    let cancelled = false
    void getCustomHotkeys()
      .then((result) => {
        if (cancelled) return
        const fromAccount = parseCustomHotkeys(result.customHotkeys)
        if (Object.keys(fromAccount).length === 0) return
        accountLoaded.current = true
        setCustomHotkeys(fromAccount)
        saveCustomHotkeys(fromAccount)
        setBootKey(2)
      })
      .catch(() => {
        // Guest / offline — keep localStorage
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <HotkeysProvider
      key={`hotkeys-${bootKey}`}
      appHotkeys={appHotkeys}
      customHotkeys={customHotkeys}
      onCustomHotkeysChange={(next) => {
        setCustomHotkeys(next)
        saveCustomHotkeys(next)
        if (persistTimer.current) clearTimeout(persistTimer.current)
        persistTimer.current = setTimeout(() => {
          void updateSettings({
            data: { customHotkeys: serializeCustomHotkeys(next) },
          }).catch(() => {
            // Account sync is best-effort
          })
        }, 400)
      }}
      defaultOptions={{
        hotkey: {
          requireReset: true,
        },
      }}
    >
      {children}
    </HotkeysProvider>
  )
}
