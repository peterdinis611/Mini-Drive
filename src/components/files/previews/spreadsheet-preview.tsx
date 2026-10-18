import { useEffect, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

import type { PreviewShellProps } from './types'

function parseDelimited(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const delimiter = firstLine.includes('\t')
    ? '\t'
    : firstLine.includes(';')
      ? ';'
      : ','

  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .slice(0, 80)
    .map((line) => line.split(delimiter).slice(0, 12))
}

export function SpreadsheetPreview({
  url,
  fileName,
  mimeType,
}: PreviewShellProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const cancelledRef = useRef(false)
  const isBinarySheet =
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    /\.xlsx?$/i.test(fileName)

  useEffect(() => {
    if (isBinarySheet) {
      setLoading(false)
      setContent(null)
      return
    }

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
  }, [isBinarySheet, url])

  const rows = useMemo(
    () => (content ? parseDelimited(content) : []),
    [content],
  )

  if (loading) {
    return (
      <div className="flex h-[min(70vh,640px)] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Načítavam tabuľku…
      </div>
    )
  }

  if (isBinarySheet || rows.length === 0) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FileSpreadsheet className="size-6" />
        </span>
        <p className="max-w-sm">
          {isBinarySheet
            ? 'Binárne tabuľky (XLS/XLSX) otvoríš stiahnutím. CSV/TSV majú inline náhľad.'
            : 'Tabuľku sa nepodarilo načítať.'}
        </p>
      </div>
    )
  }

  const header = rows[0] ?? []
  const body = rows.slice(1)

  return (
    <div className="flex h-[min(70vh,640px)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-emerald-500/5 px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <FileSpreadsheet className="size-3.5" />
          {fileName}
        </span>
        <span>
          {body.length} riadkov · {header.length} stĺpcov
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur">
            <tr>
              {header.map((cell, index) => (
                <th
                  key={index}
                  className="border-b border-border px-3 py-2 font-semibold whitespace-nowrap"
                >
                  {cell || `Col ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="odd:bg-background even:bg-muted/30"
              >
                {header.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border-b border-border/60 px-3 py-1.5 whitespace-nowrap text-foreground/85"
                  >
                    {row[colIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
