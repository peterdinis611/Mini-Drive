'use client'

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileIcon, Folder, Star } from 'lucide-react'

import { listFavorites } from '#/server/functions/favorites'
import { cn } from '#/lib/utils'

type FavoriteItem =
  | {
      id: string
      targetType: 'file'
      targetId: string
      name: string
      folderId: string | null
    }
  | {
      id: string
      targetType: 'folder'
      targetId: string
      name: string
      parentId: string | null
    }

type Props = {
  onNavigate?: () => void
  className?: string
}

export function FavoritesNav({ onNavigate, className }: Props) {
  const [items, setItems] = useState<FavoriteItem[]>([])

  useEffect(() => {
    let cancelled = false
    void listFavorites()
      .then((rows) => {
        if (!cancelled) setItems(rows as FavoriteItem[])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (items.length === 0) return null

  return (
    <section
      className={cn('space-y-1 px-2', className)}
      aria-labelledby="sidebar-favorites-heading"
    >
      <h2
        id="sidebar-favorites-heading"
        className="flex items-center gap-1.5 px-1.5 font-meta text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase"
      >
        <Star className="size-3 fill-current" aria-hidden />
        Obľúbené
      </h2>
      <ul className="m-0 list-none space-y-0.5 p-0">
        {items.slice(0, 12).map((item) => {
          if (item.targetType === 'folder') {
            return (
              <li key={item.id}>
                <Link
                  to="/files/$folderId"
                  params={{ folderId: item.targetId }}
                  onClick={onNavigate}
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-muted-foreground transition hover:bg-sidebar-accent/70 hover:text-foreground"
                >
                  <Folder className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            )
          }
          if (item.folderId) {
            return (
              <li key={item.id}>
                <Link
                  to="/files/$folderId"
                  params={{ folderId: item.folderId }}
                  search={{ preview: item.targetId }}
                  onClick={onNavigate}
                  className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-muted-foreground transition hover:bg-sidebar-accent/70 hover:text-foreground"
                >
                  <FileIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            )
          }
          return (
            <li key={item.id}>
              <Link
                to="/files"
                search={{ preview: item.targetId }}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-full px-3 py-1 text-sm text-muted-foreground transition hover:bg-sidebar-accent/70 hover:text-foreground"
              >
                <FileIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
