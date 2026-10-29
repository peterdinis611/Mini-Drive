'use client'

import { useId, useMemo, useState } from 'react'

const TTL_OPTIONS = [
  { id: '1h', label: '1 hodina', hours: 1 },
  { id: '24h', label: '24 hodín', hours: 24 },
  { id: '7d', label: '7 dní', hours: 168 },
] as const

type TtlId = (typeof TTL_OPTIONS)[number]['id']

/** Live hero control: mint a temporary safe-url by choosing TTL. */
export function SafeUrlControl() {
  const labelId = useId()
  const [ttl, setTtl] = useState<TtlId>('24h')

  const token = useMemo(() => {
    const hours = TTL_OPTIONS.find((o) => o.id === ttl)?.hours ?? 24
    const seed = hours * 7919
    return `s_${(seed % 36 ** 6).toString(36).padStart(6, '0')}k7xq`
  }, [ttl])

  const expiresAt = useMemo(() => {
    const hours = TTL_OPTIONS.find((o) => o.id === ttl)?.hours ?? 24
    const date = new Date(Date.now() + hours * 60 * 60 * 1000)
    return date.toLocaleString('sk-SK', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [ttl])

  return (
    <div className="landing-safeurl" data-ui>
      <p className="landing-safeurl-label" id={labelId}>
        Safe-url pre súbor
      </p>
      <div className="landing-safeurl-file">
        <div>
          <strong>zmluva-2026.pdf</strong>
          <span className="landing-safeurl-label" style={{ display: 'block' }}>
            248 KB · private ACL
          </span>
        </div>
        <span style={{ color: 'var(--lp-ui-chart)', fontWeight: 500 }}>
          zdieľať
        </span>
      </div>

      <div className="landing-ttl" role="group" aria-labelledby={labelId}>
        {TTL_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={ttl === option.id}
            onClick={() => setTtl(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="landing-url-readout" aria-live="polite">
        mini.drive/s/<em>{token}</em>
      </p>

      <div className="landing-meta-row">
        <span>Expirácia {expiresAt}</span>
        <span>bez CDN kľúča</span>
      </div>
    </div>
  )
}
