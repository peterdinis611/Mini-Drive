'use client'

import { useAuth } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'

type Props = {
  className?: string
  guestTo?: '/sign-up/$' | '/sign-in/$'
  guestLabel: string
  signedInLabel?: string
  arrow?: React.ReactNode
}

/**
 * Marketing CTA that swaps sign-up for /files when the user is already signed in.
 */
export function LandingGuestCta({
  className,
  guestTo = '/sign-up/$',
  guestLabel,
  signedInLabel = 'Otvoriť Drive',
  arrow,
}: Props) {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return (
      <Link className={className} to="/files" preload="intent">
        {signedInLabel}
        {arrow}
      </Link>
    )
  }

  return (
    <Link className={className} to={guestTo} preload="intent">
      {guestLabel}
      {arrow}
    </Link>
  )
}

/** Footer auth links — hide register/sign-in when already signed in. */
export function LandingAuthFooterLinks() {
  const { isLoaded, isSignedIn } = useAuth()

  if (isLoaded && isSignedIn) {
    return (
      <Link to="/files" preload="intent">
        Otvoriť Drive
      </Link>
    )
  }

  return (
    <>
      <Link to="/sign-in/$" preload="intent">
        Prihlásenie
      </Link>
      {' · '}
      <Link to="/sign-up/$" preload="intent">
        Registrácia
      </Link>
    </>
  )
}
