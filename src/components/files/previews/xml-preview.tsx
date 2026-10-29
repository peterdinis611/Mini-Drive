'use client'

import { Braces, WrapText } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'
import { PreviewLoading } from '#/components/ui/preload-spinner'
import { cn } from '#/lib/utils'
import { prettyPrintXml, tokenizeXmlLine } from '#/lib/xml-format'

import type { PreviewShellProps } from './types'

export function XmlPreview({ url, fileName }: PreviewShellProps) {
  const [raw, setRaw] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pretty, setPretty] = useState(true)
  const [wrap, setWrap] = useState(false)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setLoading(true)
    setRaw(null)

    void (async () => {
      try {
        const res = await fetch(url)
        const text = await res.text()
        if (cancelledRef.current) return
        setRaw(text.slice(0, 200_000))
      } catch {
        if (cancelledRef.current) return
        setRaw(null)
      } finally {
        if (!cancelledRef.current) setLoading(false)
      }
    })()

    return () => {
      cancelledRef.current = true
    }
  }, [url])

  const display = useMemo(() => {
    if (!raw) return null
    return pretty ? prettyPrintXml(raw) : raw
  }, [raw, pretty])

  const lines = useMemo(() => (display ?? '').split('\n'), [display])

  if (loading) {
    return (
      <PreviewLoading className="h-[min(70vh,640px)]" label="Načítavam XML…" />
    )
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-xl border border-border bg-[#0c1219]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#121a24] px-3 py-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 truncate text-xs text-white/80">
            <Braces className="size-3.5 text-amber-400" aria-hidden />
            {fileName}
          </p>
          <p className="font-meta text-[10px] tracking-wide text-white/40 uppercase">
            XML · {lines.length} riadkov
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              'h-7 text-xs text-white/70 hover:bg-white/10 hover:text-white',
              pretty && 'bg-amber-400/15 text-amber-200',
            )}
            onClick={() => setPretty((value) => !value)}
          >
            Pretty
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              'size-7 text-white/70 hover:bg-white/10 hover:text-white',
              wrap && 'bg-white/10 text-white',
            )}
            aria-label="Zalomiť riadky"
            onClick={() => setWrap((value) => !value)}
          >
            <WrapText className="size-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto font-mono text-[12px] leading-5">
        {display ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-white/[0.03]">
                  <td className="sticky left-0 w-12 select-none bg-[#0c1219] px-3 py-0 text-right text-white/25">
                    {index + 1}
                  </td>
                  <td
                    className={cn(
                      'px-3 py-0 text-white/85',
                      wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
                    )}
                  >
                    {tokenizeXmlLine(line).map((token, tokenIndex) => (
                      <span
                        key={tokenIndex}
                        className={cn(
                          token.type === 'tag' && 'text-sky-300',
                          token.type === 'attr-name' && 'text-violet-300',
                          token.type === 'attr-value' && 'text-emerald-300',
                          token.type === 'comment' && 'text-white/35 italic',
                          token.type === 'text' && 'text-amber-100/90',
                          token.type === 'plain' && 'text-white/70',
                        )}
                      >
                        {token.value || ' '}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-white/50">
            XML sa nepodarilo načítať.
          </p>
        )}
      </div>
    </div>
  )
}
