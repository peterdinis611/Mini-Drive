import { useClerk } from '@clerk/tanstack-react-start'
import { useState, useTransition } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  AlertTriangle,
  HardDrive,
  KeyRound,
  LayoutGrid,
  Link2,
  List,
  Monitor,
  Moon,
  Save,
  Shield,
  Sun,
  Trash2,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AppShell } from '#/components/layout/app-shell'
import { usePersistTheme } from '#/hooks/use-persist-theme'
import { FadeIn } from '#/components/motion/fade-in'
import { Stagger, StaggerItem } from '#/components/motion/stagger'
import { DeleteAllDialog } from '#/components/settings/delete-all-dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Switch } from '#/components/ui/switch'
import {
  AUTH_LIMITS,
  SHARE_EXPIRY_PRESETS,
  STORAGE_QUOTA_BYTES,
  TRASH_RETENTION_DAYS,
  UPLOAD_LIMITS,
} from '#/lib/constants'
import { getErrorMessage } from '#/lib/errors'
import { formatFileSize } from '#/lib/format'
import { riseTransition } from '#/lib/motion'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { toast } from '#/lib/toast'
import { cn } from '#/lib/utils'
import {
  DELETE_ALL_CONFIRM_WORD,
  themePreferenceSchema,
  updateSettingsSchema,
  viewPreferenceSchema,
} from '#/lib/validation'
import { getAppChrome } from '#/server/functions/drive'
import { updateSettings } from '#/server/functions/settings'
import { deleteAllDriveContent } from '#/server/functions/trash'
import type { z } from 'zod'

export const Route = createFileRoute('/settings')({
  beforeLoad: requireOnboardedSession,
  loader: async () => getAppChrome(),
  head: () => privateAppHead('Nastavenia', '/settings'),
  component: SettingsPage,
})

type ViewPreference = z.infer<typeof viewPreferenceSchema>
type ThemePreference = z.infer<typeof themePreferenceSchema>

function SettingsPage() {
  const chrome = Route.useLoaderData()
  const router = useRouter()
  const reduce = useReducedMotion()
  const applyTheme = usePersistTheme()
  const { openUserProfile } = useClerk()

  const [name, setName] = useState(chrome.user.name)
  const [viewPreference, setViewPreference] = useState<ViewPreference>(
    chrome.user.viewPreference,
  )
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    chrome.user.themePreference ?? 'system',
  )
  const [defaultShareExpiresIn, setDefaultShareExpiresIn] = useState(
    chrome.user.defaultShareExpiresIn ?? SHARE_EXPIRY_PRESETS[1].value,
  )
  const [confirmDelete, setConfirmDelete] = useState(
    chrome.user.confirmDelete ?? true,
  )
  const [pending, startTransition] = useTransition()
  const [wipePending, startWipeTransition] = useTransition()
  const [nameError, setNameError] = useState<string | null>(null)
  const [wipeOpen, setWipeOpen] = useState(false)

  const fill = Math.min(
    1,
    chrome.stats.totalBytes / Math.max(chrome.stats.quotaBytes, 1),
  )
  const hasDriveContent =
    chrome.stats.fileCount > 0 || chrome.stats.folderCount > 0

  function wipeEverything() {
    startWipeTransition(async () => {
      try {
        const result = await deleteAllDriveContent({
          data: { confirm: DELETE_ALL_CONFIRM_WORD },
        })
        setWipeOpen(false)
        toast.success('Drive je v koši', {
          description: `${result.deletedFolders} priečinkov · ${result.deletedFiles} súborov.`,
        })
        await router.invalidate()
      } catch (error) {
        toast.error(getErrorMessage(error, 'Mazanie zlyhalo'))
      }
    })
  }

  function saveAll() {
    const parsed = updateSettingsSchema.safeParse({
      name: name.trim(),
      viewPreference,
      themePreference,
      defaultShareExpiresIn,
      confirmDelete,
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Neplatné nastavenia'
      setNameError(message)
      toast.error(message)
      return
    }
    setNameError(null)
    startTransition(async () => {
      try {
        await updateSettings({ data: parsed.data })
        applyTheme(themePreference)
        toast.success('Nastavenia uložené', {
          description: 'Profil a preferencie sú aktualizované.',
        })
        await router.invalidate()
      } catch (error) {
        toast.error(getErrorMessage(error, 'Uloženie zlyhalo'))
      }
    })
  }

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
          <Button type="button" disabled={pending} onClick={saveAll}>
            <Save />
            Uložiť
          </Button>
        </motion.div>
      }
    >
      <FadeIn className="mx-auto max-w-xl">
        <Stagger slow className="space-y-6">
          <StaggerItem>
            <section className="space-y-4 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
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
            <section className="space-y-4 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
              <h2 className="font-display text-xl">Vzhľad</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Téma</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        value: 'light' as const,
                        label: 'Svetlá',
                        icon: Sun,
                      },
                      {
                        value: 'dark' as const,
                        label: 'Tmavá',
                        icon: Moon,
                      },
                      {
                        value: 'system' as const,
                        label: 'Systém',
                        icon: Monitor,
                      },
                    ] as const
                  ).map((option) => {
                    const selected = themePreference === option.value
                    const Icon = option.icon
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        className={cn(
                          'rounded-2xl border-2 p-3 text-left transition',
                          selected
                            ? 'border-foreground bg-primary/25 dark:border-primary dark:bg-primary/20'
                            : 'border-border hover:bg-muted/60',
                        )}
                        onClick={() => {
                          setThemePreference(option.value)
                          applyTheme(option.value)
                        }}
                        whileHover={reduce ? undefined : { y: -2 }}
                        whileTap={reduce ? undefined : { scale: 0.985 }}
                        transition={riseTransition}
                      >
                        <Icon
                          className={cn(
                            'mb-2 size-5',
                            selected
                              ? 'text-foreground dark:text-primary'
                              : 'text-muted-foreground',
                          )}
                          aria-hidden
                        />
                        <p className="text-sm font-medium">{option.label}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">
                  Predvolené zobrazenie súborov
                </p>
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
                          'rounded-2xl border-2 p-4 text-left transition',
                          selected
                            ? 'border-foreground bg-primary/25 dark:border-primary dark:bg-primary/20'
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
                            selected
                              ? 'text-foreground dark:text-primary'
                              : 'text-muted-foreground',
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
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="space-y-4 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-full border-2 border-foreground/15 bg-primary/25 text-foreground dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                  <Link2 className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl">Zdieľanie a mazanie</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Predvolené správanie Drive akcií.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Predvolená platnosť safe-url</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SHARE_EXPIRY_PRESETS.map((preset) => {
                    const selected = defaultShareExpiresIn === preset.value
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        aria-pressed={selected}
                        className={cn(
                          'rounded-xl border-2 p-3 text-left text-sm transition',
                          selected
                            ? 'border-foreground bg-primary/25 dark:border-primary dark:bg-primary/20'
                            : 'border-border hover:bg-muted/60',
                        )}
                        onClick={() => setDefaultShareExpiresIn(preset.value)}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Potvrdiť pred zmazaním</p>
                  <p className="text-xs text-muted-foreground">
                    Soft-delete do koša (retenčia {TRASH_RETENTION_DAYS} dní).
                  </p>
                </div>
                <Switch
                  checked={confirmDelete}
                  onCheckedChange={setConfirmDelete}
                  aria-label="Potvrdiť pred zmazaním"
                />
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="space-y-4 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-full border-2 border-foreground/15 bg-primary/25 text-foreground dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                  <KeyRound className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl">Účet a heslo</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Heslo, e-mail a bezpečnostné nastavenia spravuješ v Clerk
                    profile.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => openUserProfile()}
              >
                Otvoriť Clerk účet
              </Button>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-foreground/15 bg-primary/20 text-foreground sm:size-24 dark:border-primary/40 dark:bg-primary/15 dark:text-primary">
                  <HardDrive className="size-7" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="font-display text-xl">Úložisko</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {chrome.stats.fileCount} súborov ·{' '}
                    {chrome.stats.folderCount} priečinkov
                  </p>
                  <p className="mt-3 font-display text-2xl text-foreground">
                    {formatFileSize(chrome.stats.totalBytes)}
                    {' / '}
                    {formatFileSize(chrome.stats.quotaBytes)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    použité · tvrdá kvóta {formatFileSize(STORAGE_QUOTA_BYTES)}
                  </p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${Math.max(4, fill * 100)}%` }}
                      transition={{ ...riseTransition, delay: 0.15 }}
                    />
                  </div>
                  <ul className="mt-4 space-y-1.5 text-left text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Trash2 className="size-3.5 shrink-0" aria-hidden />
                      Kôš drží súbory {TRASH_RETENTION_DAYS} dní —{' '}
                      <Link
                        to="/trash"
                        className="text-foreground underline-offset-2 hover:underline dark:text-primary"
                      >
                        otvoriť kôš
                      </Link>
                    </li>
                    <li>
                      Upload max {UPLOAD_LIMITS.maxFileSize} ·{' '}
                      {UPLOAD_LIMITS.maxFileCount} súborov naraz
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border-2 border-destructive/25 bg-destructive/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base">Zmazať všetko</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Presunie všetky súbory a priečinky do koša naraz. Dá sa
                      obnoviť; trvalé zmazanie je až cez vyprázdnenie koša.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={!hasDriveContent || wipePending}
                  onClick={() => setWipeOpen(true)}
                >
                  <Trash2 />
                  {hasDriveContent
                    ? 'Zmazať všetky súbory a priečinky'
                    : 'Úložisko je prázdne'}
                </Button>
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="space-y-3 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-full border-2 border-foreground/15 bg-primary/25 text-foreground dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
                  <Shield className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="font-display text-xl">Bezpečnosť</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Čo Mini Drive už robí za teba.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  Verejné zdieľania idú cez short-lived signed URL; IP v audite
                  je len HMAC otlačok.
                </li>
                <li>
                  Pred vytvorením odkazu sa súbor skenuje (heuristiky + voliteľný
                  ClamAV).
                </li>
                <li>
                  CSP + CSRF + rate limity na share create/resolve.
                </li>
              </ul>
              <Button asChild variant="outline" size="sm">
                <Link to="/shares">Spravovať zdieľania</Link>
              </Button>
            </section>
          </StaggerItem>
        </Stagger>
      </FadeIn>

      <DeleteAllDialog
        open={wipeOpen}
        fileCount={chrome.stats.fileCount}
        folderCount={chrome.stats.folderCount}
        onOpenChange={setWipeOpen}
        onConfirm={wipeEverything}
      />
    </AppShell>
  )
}
