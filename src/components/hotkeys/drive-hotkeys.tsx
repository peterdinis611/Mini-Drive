'use client'

import { useAppHotkeys, useHotkeys } from '@tanstack/react-hotkeys'
import { useNavigate } from '@tanstack/react-router'

import { dispatchQuickAction } from '#/lib/quick-actions'

/** Registers global Drive app hotkeys while the app shell is mounted. */
export function DriveHotkeys() {
  const navigate = useNavigate()
  const keys = useAppHotkeys()

  useHotkeys([
    {
      hotkey: keys['files.upload'],
      callback: () => dispatchQuickAction('upload'),
    },
    {
      hotkey: keys['files.new-folder'],
      callback: () => dispatchQuickAction('create-folder'),
    },
    {
      hotkey: keys['nav.files'],
      callback: () => {
        void navigate({ to: '/files' })
      },
    },
    {
      hotkey: keys['nav.recent'],
      callback: () => {
        void navigate({ to: '/recent' })
      },
    },
    {
      hotkey: keys['nav.shares'],
      callback: () => {
        void navigate({ to: '/shares' })
      },
    },
    {
      hotkey: keys['nav.trash'],
      callback: () => {
        void navigate({ to: '/trash' })
      },
    },
    {
      hotkey: keys['nav.settings'],
      callback: () => {
        void navigate({ to: '/settings' })
      },
    },
    {
      hotkey: keys['ui.scroll-top'],
      callback: () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
      },
    },
  ])

  return null
}
