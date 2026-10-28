'use client'

import { useAuth } from '@clerk/tanstack-react-start'
import { useTheme } from 'next-themes'

import { useDebouncedCallback } from '@tanstack/react-pacer'

import { markThemeSynced, type ThemePreference } from '#/lib/theme-preference'
import { updateSettings } from '#/server/functions/settings'

/**
 * setTheme + (when signed in) persist to DB without letting ThemeSync clobber it.
 */
export function usePersistTheme() {
  const { setTheme } = useTheme()
  const { isSignedIn, userId } = useAuth()

  const persist = useDebouncedCallback(
    (pref: ThemePreference) => {
      void updateSettings({ data: { themePreference: pref } }).catch(() => {
        // keep local theme even if save fails
      })
    },
    { wait: 400 },
  )

  return function applyTheme(pref: ThemePreference) {
    setTheme(pref)
    if (isSignedIn && userId) {
      markThemeSynced(userId)
      persist(pref)
    }
  }
}
