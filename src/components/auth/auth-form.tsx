import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { APP_NAME } from '#/lib/constants'
import { authClient } from '#/lib/auth-client'
import { fadeUp, riseTransition, staggerSlow } from '#/lib/motion'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
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
    <div className="relative flex min-h-svh flex-col justify-center overflow-hidden px-4 py-10">
      <motion.div
        className="status-page-mesh pointer-events-none absolute inset-0"
        aria-hidden
        initial={reduce ? false : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="relative z-10 mx-auto w-full max-w-sm"
        variants={reduce ? undefined : staggerSlow}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <motion.div
          className="mb-8 space-y-2 text-center"
          variants={reduce ? undefined : fadeUp}
        >
          <motion.div
            className="mx-auto flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
            whileHover={reduce ? undefined : { scale: 1.08, rotate: -4 }}
            whileTap={reduce ? undefined : { scale: 0.95 }}
            transition={riseTransition}
          >
            M
          </motion.div>
          <h1 className="font-display text-3xl">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Prihlás sa do svojho úložiska'
              : 'Vytvor si účet'}
          </p>
        </motion.div>

        <motion.form
          className="space-y-4"
          onSubmit={onSubmit}
          noValidate
          variants={reduce ? undefined : fadeUp}
        >
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

          <motion.div
            whileHover={reduce || pending ? undefined : { y: -1 }}
            whileTap={reduce || pending ? undefined : { scale: 0.985 }}
          >
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {mode === 'login' ? 'Prihlásiť sa' : 'Vytvoriť účet'}
            </Button>
          </motion.div>
        </motion.form>

        <motion.p
          className="mt-6 text-center text-sm text-muted-foreground"
          variants={reduce ? undefined : fadeUp}
        >
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
        </motion.p>
      </motion.div>
    </div>
  )
}
