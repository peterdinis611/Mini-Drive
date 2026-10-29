'use client'

import type { AppHotkeyId, Hotkey } from '@tanstack/react-hotkeys'
import {
  formatForDisplay,
  useAppHotkeyList,
  useCustomHotkeys,
  useHotkeyRecorder,
} from '@tanstack/react-hotkeys'
import { Keyboard, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

function HotkeyRow({
  id,
  name,
  description,
  hotkey,
  status,
  isCustom,
}: {
  id: AppHotkeyId
  name: string
  description?: string
  hotkey: Hotkey | null
  status: string
  isCustom: boolean
}) {
  const { setCustomHotkey, resetCustomHotkey, findConflicts } =
    useCustomHotkeys()
  const [error, setError] = useState<string | null>(null)

  const recorder = useHotkeyRecorder({
    maxSteps: Infinity,
    validate: (hotkeyValue) => {
      const conflicts = findConflicts(id, hotkeyValue)
      if (conflicts.length === 0) return true
      const conflictName = conflicts[0]?.meta?.name ?? conflicts[0]?.id
      return `Používa „${conflictName}“`
    },
    onRecord: (hotkeyValue) => {
      const conflicts = setCustomHotkey(id, hotkeyValue)
      if (conflicts.length > 0) {
        setError(
          `Konflikt so „${conflicts[0]?.meta?.name ?? conflicts[0]?.id}“`,
        )
        return
      }
      setError(null)
    },
    onClear: () => {
      setCustomHotkey(id, null)
      setError(null)
    },
  })

  const label = formatHotkeyLabel(hotkey)
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-muted/15 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        {error ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <kbd
          className={cn(
            'inline-flex min-w-[4.5rem] items-center justify-center rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] tabular-nums',
            recorder.isRecording && 'border-primary bg-primary/10 text-primary',
            status === 'unbound' && 'text-muted-foreground',
          )}
        >
          {recorder.isRecording
            ? recorder.steps.length > 0
              ? formatForDisplay(recorder.steps)
              : 'Stlač klávesy…'
            : label}
        </kbd>
        <Button
          type="button"
          size="sm"
          variant={recorder.isRecording ? 'secondary' : 'outline'}
          onClick={() => {
            setError(null)
            if (recorder.isRecording) recorder.cancelRecording()
            else recorder.startRecording()
          }}
        >
          {recorder.isRecording ? 'Zrušiť' : 'Zmeniť'}
        </Button>
        {isCustom ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Obnoviť predvolenú skratku"
            title="Obnoviť predvolenú"
            onClick={() => {
              resetCustomHotkey(id)
              setError(null)
            }}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function formatHotkeyLabel(hotkey: Hotkey | null | undefined) {
  if (!hotkey) return 'Nepriradené'
  return formatForDisplay(hotkey)
}

export function HotkeysSettings() {
  const items = useAppHotkeyList()
  const { resetCustomHotkeys } = useCustomHotkeys()

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>()
    for (const item of items) {
      const group = item.appHotkey.meta?.group ?? 'Ostatné'
      const list = map.get(group) ?? []
      list.push(item)
      map.set(group, list)
    }
    return [...map.entries()]
  }, [items])

  const hasCustom = items.some((item) => item.isCustom)

  return (
    <section className="space-y-4 rounded-2xl border-2 border-foreground/12 bg-card/70 p-5 sm:p-6 dark:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-full border-2 border-foreground/15 bg-primary/25 text-foreground dark:border-primary/40 dark:bg-primary/20 dark:text-primary">
            <Keyboard className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl">Klávesové skratky</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              TanStack Hotkeys — zmeň väzby; sync na účet + localStorage. Cheat
              sheet:{' '}
              <kbd className="rounded border px-1 font-mono text-[11px]">?</kbd>
            </p>
          </div>
        </div>
        {hasCustom ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => resetCustomHotkeys()}
          >
            <RotateCcw />
            Reset všetkých
          </Button>
        ) : null}
      </div>

      <div className="space-y-5">
        {groups.map(([group, groupItems]) => (
          <div key={group} className="space-y-2">
            <p className="font-meta text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {group}
            </p>
            <div className="space-y-2">
              {groupItems.map((item) => (
                <HotkeyRow
                  key={item.appHotkey.id}
                  id={item.appHotkey.id}
                  name={item.appHotkey.meta?.name ?? item.appHotkey.id}
                  description={item.appHotkey.meta?.description}
                  hotkey={item.appHotkey.hotkey}
                  status={item.status}
                  isCustom={item.isCustom}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
