'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, Search } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import { columnLabel, parseDelimitedText } from '#/lib/csv-parse'
import { cn } from '#/lib/utils'

import { OfficePreview } from './office-preview'
import type { PreviewShellProps } from './types'

export function SpreadsheetPreview(props: PreviewShellProps) {
  const { fileName, mimeType } = props
  const isBinarySheet =
    mimeType.includes('sheet') ||
    mimeType.includes('excel') ||
    /\.xlsx?$/i.test(fileName)

  if (isBinarySheet) {
    return <OfficePreview {...props} />
  }

  return <CsvPreview {...props} />
}

function CsvPreview({ url, fileName }: PreviewShellProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
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
        setContent(text.slice(0, 400_000))
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

  const parsed = useMemo(
    () => (content ? parseDelimitedText(content) : null),
    [content],
  )

  const header = parsed?.rows[0] ?? []
  const body = useMemo(() => {
    const rows = parsed?.rows.slice(1) ?? []
    const q = filter.trim().toLocaleLowerCase('sk-SK')
    if (!q) return rows
    return rows.filter((row) =>
      row.some((cell) => cell.toLocaleLowerCase('sk-SK').includes(q)),
    )
  }, [parsed, filter])

  if (loading) {
    return (
      <PreviewLoading
        className="h-[min(70vh,640px)]"
        label="Načítavam CSV…"
      />
    )
  }

  if (!parsed || parsed.rows.length === 0) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <FileSpreadsheet className="size-6" />
        </span>
        <p className="max-w-sm">Tabuľku sa nepodarilo načítať.</p>
      </div>
    )
  }

  const colCount = Math.max(
    header.length,
    ...parsed.rows.map((row) => row.length),
    1,
  )

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-emerald-500/[0.06] px-3 py-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 truncate text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <FileSpreadsheet className="size-3.5" aria-hidden />
            {fileName}
          </p>
          <p className="font-meta text-[10px] tracking-wide text-muted-foreground uppercase">
            CSV · delimiter{' '}
            {parsed.delimiter === '\t' ? 'TAB' : JSON.stringify(parsed.delimiter)}{' '}
            · {body.length}
            {filter ? ` / ${parsed.rows.length - 1}` : ''} riadkov · {colCount}{' '}
            stĺpcov
          </p>
        </div>
        <div className="relative w-full max-w-[220px]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrovať riadky…"
            className="h-8 pl-8 text-xs"
            aria-label="Filtrovať CSV"
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-left text-[12px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/95 backdrop-blur">
              <th className="sticky left-0 z-20 border-b border-r border-border bg-muted px-2 py-1.5 text-center font-meta text-[10px] text-muted-foreground">
                #
              </th>
              {Array.from({ length: colCount }, (_, index) => (
                <th
                  key={index}
                  className="border-b border-border px-3 py-1.5 font-semibold whitespace-nowrap"
                >
                  <span className="mr-2 font-meta text-[10px] text-muted-foreground">
                    {columnLabel(index)}
                  </span>
                  {header[index] || `Col ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b border-border/50',
                  rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/25',
                )}
              >
                <td className="sticky left-0 border-r border-border/60 bg-inherit px-2 py-1 text-center font-meta text-[10px] text-muted-foreground tabular-nums">
                  {rowIndex + 1}
                </td>
                {Array.from({ length: colCount }, (_, colIndex) => (
                  <td
                    key={colIndex}
                    className="max-w-[280px] truncate px-3 py-1.5 whitespace-nowrap text-foreground/90"
                    title={row[colIndex] ?? ''}
                  >
                    {row[colIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {body.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Žiadne riadky pre „{filter}“.
          </p>
        ) : null}
      </div>
    </div>
  )
}
