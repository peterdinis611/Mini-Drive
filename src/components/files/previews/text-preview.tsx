'use client'

import { AlignLeft, CaseSensitive, FileText, WrapText } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import { cn } from '#/lib/utils'

import type { PreviewShellProps } from './types'

export function TextPreview({ url, fileName }: PreviewShellProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [wrap, setWrap] = useState(true)
  const [prose, setProse] = useState(true)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)
    setContent(null)

    void (async () => {
      try {
        const res = await fetch(url)
        const text = await res.text()
        if (cancelledRef.current) return
        setContent(text.slice(0, 200_000))
      } catch {
        if (cancelledRef.current) return
        setContent(null)
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    })()

    return () => {
      cancelledRef.current = true
    }
  }, [url])

  const stats = useMemo(() => {
    if (!content) return { lines: 0, words: 0, chars: 0 }
    const lines = content.split(/\r?\n/).length
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    return { lines, words, chars: content.length }
  }, [content])

  if (loading) {
    return (
      <PreviewLoading className="h-[min(70vh,640px)]" label="Načítavam text…" />
    )
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 truncate text-xs font-medium">
            <FileText className="size-3.5 text-primary" aria-hidden />
            {fileName}
          </p>
          <p className="font-meta text-[10px] tracking-wide text-muted-foreground uppercase">
            TXT · {stats.lines} riadkov · {stats.words} slov · {stats.chars}{' '}
            znakov
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn('h-7 text-xs', prose && 'bg-primary/10 text-primary')}
            onClick={() => setProse((value) => !value)}
          >
            <AlignLeft className="size-3.5" />
            Čítanie
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn('size-7', wrap && 'bg-muted')}
            aria-label="Zalomiť riadky"
            onClick={() => setWrap((value) => !value)}
          >
            <WrapText className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn('size-7', !prose && 'bg-muted')}
            aria-label="Monospace"
            onClick={() => setProse(false)}
          >
            <CaseSensitive className="size-3.5" />
          </Button>
        </div>
      </header>

      <div
        className={cn(
          'flex-1 overflow-auto',
          prose
            ? 'bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_92%,var(--primary))_0%,var(--card)_48px)]'
            : 'bg-muted/20',
        )}
      >
        {content ? (
          prose ? (
            <article
              className={cn(
                'mx-auto max-w-2xl px-6 py-8 text-[15px] leading-7 text-foreground/90',
                wrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'overflow-x-auto whitespace-pre',
              )}
            >
              {content}
            </article>
          ) : (
            <pre
              className={cn(
                'min-h-full p-5 font-mono text-[12px] leading-5 text-foreground/90',
                wrap
                  ? 'whitespace-pre-wrap break-words'
                  : 'overflow-x-auto whitespace-pre',
              )}
            >
              {content}
            </pre>
          )
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            Text sa nepodarilo načítať.
          </p>
        )}
      </div>
    </div>
  )
}
