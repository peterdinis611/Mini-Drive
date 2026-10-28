'use client'

import { useEffect, useState } from 'react'
import { HotkeysProvider } from '@tanstack/react-hotkeys'
import type { CustomHotkeys } from '@tanstack/react-hotkeys'

import { appHotkeys } from '#/lib/app-hotkeys'
import {
  loadCustomHotkeys,
  saveCustomHotkeys,
} from '#/lib/hotkeys-storage'

type Props = {
  children: React.ReactNode
}

/**
 * Provides app hotkeys. Remounts once after reading localStorage so saved
 * custom bindings apply (provider reads `customHotkeys` only on mount).
 */
export function AppHotkeysProvider({ children }: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [customHotkeys, setCustomHotkeys] = useState<CustomHotkeys>({})

  useEffect(() => {
    setCustomHotkeys(loadCustomHotkeys())
    setHydrated(true)
  }, [])

  return (
    <HotkeysProvider
      key={hydrated ? 'hotkeys-hydrated' : 'hotkeys-boot'}
      appHotkeys={appHotkeys}
      customHotkeys={customHotkeys}
      onCustomHotkeysChange={(next) => {
        setCustomHotkeys(next)
        saveCustomHotkeys(next)
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
