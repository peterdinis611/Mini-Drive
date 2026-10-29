'use client'

import { useAuth } from '@clerk/tanstack-react-start'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

import { hasThemeSynced, markThemeSynced } from '#/lib/theme-preference'
import { getSession } from '#/server/session'

/**
 * Apply saved `themePreference` once per signed-in user / tab.
 * Never overwrites after the user (or a prior sync) has settled the theme.
 */
export function ThemeSync() {
  const { setTheme, theme } = useTheme()
  const { isLoaded, isSignedIn, userId } = useAuth()

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return
    // Wait for next-themes hydration so we don't fight the first paint.
    if (theme === undefined) return
    if (hasThemeSynced(userId)) return

    let cancelled = false

    void getSession()
      .then((session) => {
        if (cancelled || hasThemeSynced(userId)) return
        const pref = session?.user.themePreference
        if (pref === 'light' || pref === 'dark' || pref === 'system') {
          setTheme(pref)
        }
        markThemeSynced(userId)
      })
      .catch(() => {
        // Network/session failure — don't keep retrying every render.
        if (!cancelled) markThemeSynced(userId)
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, userId, theme, setTheme])

  return null
}
