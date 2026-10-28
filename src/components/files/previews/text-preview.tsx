import { useEffect, useRef, useState } from 'react'
import { FileText } from 'lucide-react'

import { PreviewLoading } from '#/components/ui/preload-spinner'

import type { PreviewShellProps } from './types'

export function TextPreview({ url, fileName }: PreviewShellProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
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
        setContent(text.slice(0, 120_000))
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

  if (loading) {
    return (
      <PreviewLoading
        className="h-[min(70vh,640px)]"
        label="Načítavam text…"
      />
    )
  }

  const lines = (content ?? '').split('\n').length

  return (
    <div className="flex h-[min(70vh,640px)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="size-3.5" />
          {fileName}
        </span>
        <span>{lines} riadkov</span>
      </div>
      <pre className="flex-1 overflow-auto p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/90">
        {content ?? 'Text sa nepodarilo načítať.'}
      </pre>
    </div>
  )
}
