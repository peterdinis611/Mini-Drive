import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { toast } from '#/lib/toast'

import { AtmosphereShell } from '#/components/layout/atmosphere-shell'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { APP_NAME, AUTH_LIMITS } from '#/lib/constants'
import { authClient } from '#/lib/auth-client'
import { firstZodFieldErrors, getErrorMessage } from '#/lib/errors'
import { fadeUp, riseTransition, staggerSlow } from '#/lib/motion'
import { loginSchema, registerSchema } from '#/lib/validation'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFieldErrors({})

    const parsed =
      mode === 'register'
        ? registerSchema.safeParse({ name, email, password })
        : loginSchema.safeParse({ email, password })

    if (!parsed.success) {
      setFieldErrors(firstZodFieldErrors(parsed.error))
      toast.error(
        parsed.error.issues[0]?.message ?? 'Skontroluj vyplnené údaje',
      )
      return
    }

    setPending(true)

    try {
      if (mode === 'register') {
        const data = registerSchema.parse(parsed.data)
        const result = await authClient.signUp.email({
          email: data.email,
          password: data.password,
          name:
            data.name.trim() ||
            data.email.split('@')[0] ||
            'User',
        })
        if (result.error) {
          throw new Error(result.error.message ?? 'Registrácia zlyhala')
        }
        toast.success('Účet vytvorený')
        await navigate({ to: '/onboarding' })
        return
      }

      const data = loginSchema.parse(parsed.data)
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })
      if (result.error) {
        throw new Error(result.error.message ?? 'Prihlásenie zlyhalo')
      }
      toast.success('Prihlásenie úspešné')
      await navigate({ to: '/' })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Neznáma chyba'))
    } finally {
      setPending(false)
    }
  }

  return (
    <AtmosphereShell intensity="bold" showHeader className="justify-center">
      <motion.div
        className="w-full rounded-2xl border border-border/80 bg-background/80 p-6 shadow-lg backdrop-blur-md sm:p-8"
        variants={reduce ? undefined : staggerSlow}
        initial={reduce ? false : 'hidden'}
        animate="show"
      >
        <motion.div
          className="mb-8 space-y-2 text-center"
          variants={reduce ? undefined : fadeUp}
        >
          <motion.div
            className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
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
                aria-invalid={Boolean(fieldErrors.name)}
                onChange={(e) => {
                  setName(e.target.value)
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => {
                      const next = { ...prev }
                      delete next.name
                      return next
                    })
                  }
                }}
                placeholder="Peter"
                maxLength={AUTH_LIMITS.nameMax}
              />
              {fieldErrors.name ? (
                <p className="text-sm text-destructive" role="alert">
                  {fieldErrors.name}
                </p>
              ) : null}
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
              aria-invalid={Boolean(fieldErrors.email)}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.email
                    return next
                  })
                }
              }}
              placeholder="ty@email.com"
            />
            {fieldErrors.email ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
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
              minLength={AUTH_LIMITS.passwordMin}
              maxLength={AUTH_LIMITS.passwordMax}
              value={password}
              aria-invalid={Boolean(fieldErrors.password)}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.password
                    return next
                  })
                }
              }}
              placeholder={`min. ${AUTH_LIMITS.passwordMin} znakov`}
            />
            {fieldErrors.password ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            ) : null}
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
    </AtmosphereShell>
  )
}
