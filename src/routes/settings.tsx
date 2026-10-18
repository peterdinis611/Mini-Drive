import { lazy, Suspense, useEffect, useState, useTransition } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { HardDrive, LayoutGrid, List, Save } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Stagger, StaggerItem } from '#/components/motion/stagger'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { AUTH_LIMITS } from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { riseTransition } from '#/lib/motion'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { toast } from '#/lib/toast'
import { cn } from '#/lib/utils'
import { updateSettingsSchema } from '#/lib/validation'
import { supportsWebGL } from '#/lib/webgl'
import { getAppChrome } from '#/server/functions/drive'
import { updateSettings } from '#/server/functions/settings'

const StorageOrb = lazy(() =>
  import('#/components/three/storage-orb').then((mod) => ({
    default: mod.StorageOrb,
  })),
)

/** Soft capacity ceiling for the visual fill (not a hard quota). */
const STORAGE_VISUAL_CAP = 5 * 1024 * 1024 * 1024

export const Route = createFileRoute('/settings')({
  beforeLoad: requireOnboardedSession,
  loader: async () => getAppChrome(),
  head: () => privateAppHead('Nastavenia', '/settings'),
  component: SettingsPage,
})

function SettingsPage() {
  const chrome = Route.useLoaderData()
  const router = useRouter()
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [name, setName] = useState(chrome.user.name)
  const [viewPreference, setViewPreference] = useState<'grid' | 'list'>(
    chrome.user.viewPreference,
  )
  const [pending, startTransition] = useTransition()
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fill = Math.min(1, chrome.stats.totalBytes / STORAGE_VISUAL_CAP)
  const webglOk = mounted && !reduce && supportsWebGL()

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Nastavenia"
      subtitle="Profil a preferencie"
      actions={
        <motion.div
          whileHover={reduce || pending ? undefined : { y: -1 }}
          whileTap={reduce || pending ? undefined : { scale: 0.98 }}
        >
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              const parsed = updateSettingsSchema.safeParse({
                name: name.trim(),
                viewPreference,
              })
              if (!parsed.success) {
                const message =
                  parsed.error.issues[0]?.message ?? 'Neplatné nastavenia'
                setNameError(message)
                toast.error(message)
                return
              }
              setNameError(null)
              startTransition(async () => {
                try {
                  await updateSettings({
                    data: parsed.data,
                  })
                  toast.success('Nastavenia uložené', {
                    description: 'Profil a zobrazenie sú aktualizované.',
                  })
                  await router.invalidate()
                } catch (error) {
                  toast.error(getErrorMessage(error, 'Uloženie zlyhalo'))
                }
              })
            }}
          >
            <Save />
            Uložiť
          </Button>
        </motion.div>
      }
    >
      <FadeIn className="mx-auto max-w-xl">
        <Stagger slow className="space-y-6">
          <StaggerItem>
            <section className="space-y-4 rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6">
              <h2 className="font-display text-xl">Profil</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Meno</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    maxLength={AUTH_LIMITS.nameMax}
                    aria-invalid={Boolean(nameError)}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (nameError) setNameError(null)
                    }}
                  />
                  {nameError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {nameError}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    value={chrome.user.email}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="space-y-4 rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6">
              <h2 className="font-display text-xl">Predvolené zobrazenie</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: 'list' as const,
                      label: 'Zoznam',
                      hint: 'Kompaktná tabuľka',
                      icon: List,
                    },
                    {
                      value: 'grid' as const,
                      label: 'Mriežka',
                      hint: 'Karty v mriežke',
                      icon: LayoutGrid,
                    },
                  ] as const
                ).map((option) => {
                  const selected = viewPreference === option.value
                  const Icon = option.icon
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={cn(
                        'rounded-xl border p-4 text-left transition',
                        selected
                          ? 'border-primary bg-accent'
                          : 'border-border hover:bg-muted/60',
                      )}
                      onClick={() => setViewPreference(option.value)}
                      whileHover={reduce ? undefined : { y: -2 }}
                      whileTap={reduce ? undefined : { scale: 0.985 }}
                      transition={riseTransition}
                    >
                      <Icon
                        className={cn(
                          'mb-3 size-5',
                          selected ? 'text-primary' : 'text-muted-foreground',
                        )}
                        aria-hidden
                      />
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.hint}
                      </p>
                    </motion.button>
                  )
                })}
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_85%_40%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_70%)]"
                aria-hidden
              />
              <div className="relative z-10 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <div className="size-28 shrink-0 sm:size-32">
                  {webglOk ? (
                    <Suspense
                      fallback={
                        <span className="flex size-full items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <HardDrive className="size-7" aria-hidden />
                        </span>
                      }
                    >
                      <StorageOrb fill={fill} className="size-full" />
                    </Suspense>
                  ) : (
                    <motion.span
                      className="flex size-full items-center justify-center rounded-2xl bg-primary/10 text-primary"
                      animate={reduce ? undefined : { y: [0, -3, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <HardDrive className="size-7" aria-hidden />
                    </motion.span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="font-display text-xl">Úložisko</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {chrome.stats.fileCount} súborov ·{' '}
                    {chrome.stats.folderCount} priečinkov
                  </p>
                  <p className="mt-3 font-display text-2xl text-foreground">
                    {formatFileSize(chrome.stats.totalBytes)}
                  </p>
                  <p className="text-xs text-muted-foreground">použité</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${Math.max(4, fill * 100)}%` }}
                      transition={{ ...riseTransition, delay: 0.15 }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </StaggerItem>
        </Stagger>
      </FadeIn>
    </AppShell>
  )
}
