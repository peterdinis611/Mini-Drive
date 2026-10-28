'use client'

import { useAuth } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'

type Props = {
  arrow: React.ReactNode
}

/**
 * Nav CTA — guests see „Začať“ → sign-up; signed-in users get „Drive“ → /files.
 */
export function LandingStartButton({ arrow }: Props) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <span className="landing-start landing-start--pending" aria-hidden>
        <span className="landing-start-label">Začať</span>
        <span className="landing-start-arrow">{arrow}</span>
      </span>
    )
  }

  if (isSignedIn) {
    return (
      <Link className="landing-start" to="/files" preload="intent">
        <span className="landing-start-label">Drive</span>
        <span className="landing-start-arrow" aria-hidden>
          {arrow}
        </span>
      </Link>
    )
  }

  return (
    <Link className="landing-start" to="/sign-up/$" preload="intent">
      <span className="landing-start-label">Začať</span>
      <span className="landing-start-arrow" aria-hidden>
        {arrow}
      </span>
    </Link>
  )
}
