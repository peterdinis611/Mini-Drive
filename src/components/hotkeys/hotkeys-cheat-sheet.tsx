'use client'

import { useMemo, useState } from 'react'
import {
  formatForDisplay,
  useAppHotkeyList,
  useAppHotkeys,
  useHotkey,
} from '@tanstack/react-hotkeys'
import { Keyboard } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'

/** Registers Shift+/ (`?`) to open the shortcuts cheat sheet. */
export function HotkeysCheatSheetHost() {
  const [open, setOpen] = useState(false)
  const keys = useAppHotkeys()
  const items = useAppHotkeyList()

  useHotkey(keys['ui.hotkeys-help'], () => {
    setOpen((value) => !value)
  })

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4" aria-hidden />
            Klávesové skratky
          </DialogTitle>
          <DialogDescription>
            Stlač{' '}
            <kbd className="rounded border px-1 font-mono text-[11px]">?</kbd>{' '}
            pre zobrazenie. Upraviť môžeš v Nastaveniach.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {groups.map(([group, groupItems]) => (
            <section key={group}>
              <h3 className="mb-2 font-meta text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {group}
              </h3>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {groupItems.map((item) => (
                  <li
                    key={item.appHotkey.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-muted-foreground">
                      {item.appHotkey.meta?.name ?? item.appHotkey.id}
                    </span>
                    <kbd className="shrink-0 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] tabular-nums">
                      {item.appHotkey.hotkey
                        ? formatForDisplay(item.appHotkey.hotkey)
                        : '—'}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
