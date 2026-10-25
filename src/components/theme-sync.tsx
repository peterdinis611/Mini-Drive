import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

import { authClient } from '#/lib/auth-client'

/**
 * Once per session, apply the user's saved themePreference from Better Auth.
 * Does not fight later manual toggles.
 */
export function ThemeSync() {
  const { setTheme } = useTheme()
  const { data } = authClient.useSession()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    const pref = (
      data?.user as { themePreference?: string } | undefined
    )?.themePreference
    if (!pref) return
    if (pref === 'light' || pref === 'dark' || pref === 'system') {
      setTheme(pref)
      applied.current = true
    }
  }, [data?.user, setTheme])

  return null
}
