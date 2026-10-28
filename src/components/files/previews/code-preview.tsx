import { useEffect, useRef, useState } from 'react'
import { FileCode2 } from 'lucide-react'

import { PreviewLoading } from '#/components/ui/preload-spinner'
import { codeLanguageFromName } from '#/lib/file-kind'

import type { PreviewShellProps } from './types'

export function CodePreview({ url, fileName }: PreviewShellProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const cancelledRef = useRef(false)
  const language = codeLanguageFromName(fileName)

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
        label="Načítavam kód…"
      />
    )
  }

  const lines = (content ?? '').split('\n')

  return (
    <div className="flex h-[min(70vh,640px)] flex-col bg-[#0f1419] text-[#e7ecf3]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-xs text-white/55">
        <span className="inline-flex items-center gap-1.5">
          <FileCode2 className="size-3.5 text-[var(--primary)]" />
          <span className="truncate text-white/80">{fileName}</span>
        </span>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-medium tracking-wide text-white/70 uppercase">
          {language}
        </span>
      </div>
      <div className="flex-1 overflow-auto font-mono text-[12px] leading-5">
        {content ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-white/[0.03]">
                  <td className="sticky left-0 w-12 select-none bg-[#0f1419] px-3 py-0 text-right text-white/25">
                    {index + 1}
                  </td>
                  <td className="px-3 py-0 whitespace-pre text-white/85">
                    {line.length === 0 ? ' ' : line}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-sm text-white/50">
            Kód sa nepodarilo načítať.
          </p>
        )}
      </div>
    </div>
  )
}
