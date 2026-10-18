import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { APP_NAME } from '#/lib/constants'
import { authClient } from '#/lib/auth-client'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)

    try {
      if (mode === 'register') {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split('@')[0] || 'User',
        })
        if (result.error) {
          throw new Error(result.error.message ?? 'Registrácia zlyhala')
        }
        toast.success('Účet vytvorený')
        await navigate({ to: '/onboarding' })
        return
      }

      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        throw new Error(result.error.message ?? 'Prihlásenie zlyhalo')
      }
      toast.success('Prihlásenie úspešné')
      await navigate({ to: '/' })
    } catch (error) {
      const message =
        error instanceof TypeError && error.message === 'Failed to fetch'
          ? 'Server neodpovedá. Otvor http://localhost:3000.'
          : error instanceof Error
            ? error.message
            : 'Neznáma chyba'
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 space-y-2 text-center">
        <div className="mx-auto flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          M
        </div>
        <h1 className="font-display text-3xl">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'login' ? 'Prihlás sa do svojho úložiska' : 'Vytvor si účet'}
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {mode === 'register' ? (
          <div className="space-y-2">
            <Label htmlFor="name">Meno</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Peter"
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ty@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Heslo</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min. 8 znakov"
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {mode === 'login' ? 'Prihlásiť sa' : 'Vytvoriť účet'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            Nemáš účet?{' '}
            <Link
              to="/register"
              className="text-primary underline-offset-4 hover:underline"
            >
              Registrácia
            </Link>
          </>
        ) : (
          <>
            Už máš účet?{' '}
            <Link
              to="/login"
              className="text-primary underline-offset-4 hover:underline"
            >
              Prihlásenie
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
