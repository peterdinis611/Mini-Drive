'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/** Landing-styled theme toggle — matches pill chrome, not app Button. */
export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : false

  return (
    <button
      type="button"
      className="landing-theme-toggle"
      aria-label={isDark ? 'Zapnúť svetlý režim' : 'Zapnúť tmavý režim'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun size={16} strokeWidth={2.25} /> : <Moon size={16} strokeWidth={2.25} />}
    </button>
  )
}
