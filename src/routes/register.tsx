import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy path — Clerk lives at /sign-up. */
export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    throw redirect({ href: '/sign-up' })
  },
})
