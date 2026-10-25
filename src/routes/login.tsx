import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy path — Clerk lives at /sign-in. */
export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    throw redirect({ href: '/sign-in' })
  },
})
