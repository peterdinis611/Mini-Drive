import { useState, useTransition } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

import { AppShell } from '#/components/layout/app-shell'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { formatFileSize } from '#/lib/format'
import { getAppChrome } from '#/server/functions/drive'
import { updateSettings } from '#/server/functions/settings'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/settings')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    if (!session.user.onboardedAt) throw redirect({ to: '/onboarding' })
    return { session }
  },
  loader: async () => getAppChrome(),
  component: SettingsPage,
})

function SettingsPage() {
  const chrome = Route.useLoaderData()
  const router = useRouter()
  const [name, setName] = useState(chrome.user.name)
  const [viewPreference, setViewPreference] = useState<'grid' | 'list'>(
    chrome.user.viewPreference,
  )
  const [pending, startTransition] = useTransition()

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Nastavenia"
      subtitle="Profil a preferencie"
      actions={
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              try {
                await updateSettings({
                  data: { name: name.trim(), viewPreference },
                })
                toast.success('Nastavenia uložené')
                await router.invalidate()
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : 'Uloženie zlyhalo',
                )
              }
            })
          }}
        >
          <Save />
          Uložiť
        </Button>
      }
    >
      <div className="mx-auto max-w-xl space-y-10 animate-rise">
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Profil</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Meno</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Predvolené zobrazenie</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: 'list', label: 'Zoznam', hint: 'Kompaktná tabuľka' },
                { value: 'grid', label: 'Mriežka', hint: 'Karty v mriežke' },
              ] as const
            ).map((option) => {
              const selected = viewPreference === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-md border p-4 text-left transition ${
                    selected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:bg-muted/60'
                  }`}
                  onClick={() => setViewPreference(option.value)}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.hint}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">Úložisko</h2>
          <p className="text-sm text-muted-foreground">
            {chrome.stats.fileCount} súborov · {chrome.stats.folderCount}{' '}
            priečinkov · {formatFileSize(chrome.stats.totalBytes)} použité
          </p>
        </section>
      </div>
    </AppShell>
  )
}
