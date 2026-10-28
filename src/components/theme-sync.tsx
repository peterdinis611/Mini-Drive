import { useAuth } from '@clerk/tanstack-react-start'
import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

import { getSession } from '#/server/session'

/**
 * Once per signed-in session, apply saved themePreference.
 * Skips the server round-trip on guest/auth pages.
 */
export function ThemeSync() {
  const { setTheme } = useTheme()
  const { isLoaded, isSignedIn } = useAuth()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current || !isLoaded || !isSignedIn) return
    let cancelled = false

    void getSession().then((session) => {
      if (cancelled || applied.current) return
      const pref = session?.user.themePreference
      if (pref === 'light' || pref === 'dark' || pref === 'system') {
        setTheme(pref)
        applied.current = true
      }
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, setTheme])

  return null
}
