'use client'

import { useState } from 'react'

const BANDS = [
  {
    id: 'private',
    sentence: 'Súbory zostanú private, kým nevytvoríš odkaz.',
    on: 'Private ACL na každom objekte. Bez raw CDN kľúča.',
    field: 'var(--lp-band-1)',
  },
  {
    id: 'share',
    sentence: 'Safe-url vyprší sám — alebo ho zrušíš.',
    on: 'Expirácia, revoke, rate limit a hashed IP audit.',
    field: 'var(--lp-band-2)',
  },
  {
    id: 'organise',
    sentence: 'Priečinky, verzie obrázkov, tvrdá kvóta.',
    on: '6,2 GB z 100 GB — spotreba je vždy viditeľná.',
    field: 'var(--lp-band-3)',
  },
  {
    id: 'trash',
    sentence: 'Kôš drží omyl pred permanentným výmazom.',
    on: 'Soft-delete s retenčným oknom, obnovenie jedným klikom.',
    field: 'var(--lp-band-4)',
  },
] as const

/** Full-bleed capability bands — each sentence ends in a live switch. */
export function CapabilityBands() {
  const [on, setOn] = useState<Record<string, boolean>>({
    private: true,
    share: true,
    organise: false,
    trash: false,
  })

  return (
    <section className="landing-bands" aria-label="Schopnosti archívu">
      {BANDS.map((band) => {
        const active = on[band.id]
        return (
          <div
            key={band.id}
            className="landing-band"
            data-on={active}
            style={
              active
                ? ({ background: band.field } as React.CSSProperties)
                : undefined
            }
          >
            <div className="landing-band-copy">
              <p className="landing-band-sentence">{band.sentence}</p>
              {active ? (
                <p className="landing-band-consequence">{band.on}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="landing-toggle landing-band-toggle"
              role="switch"
              aria-checked={active}
              aria-label={band.sentence}
              data-ui
              onClick={() =>
                setOn((prev) => ({ ...prev, [band.id]: !prev[band.id] }))
              }
            />
          </div>
        )
      })}
    </section>
  )
}
