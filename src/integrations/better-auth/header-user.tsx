import { Show, UserButton } from '@clerk/tanstack-react-start'

/** Signed-in account control (Clerk) — inherits ThemedClerkProvider appearance. */
export default function HeaderUser() {
  return (
    <Show when="signed-in">
      <UserButton />
    </Show>
  )
}
