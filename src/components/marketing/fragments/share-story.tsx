'use client'

import { useEffect, useRef, useState } from 'react'

const STEPS = [
  {
    title: 'Vyber súbor.',
    body: 'Zo súkromného archívu. Nič nie je public, kým nevytvoríš odkaz.',
  },
  {
    title: 'Nastav expiráciu.',
    body: 'Hodina, deň alebo týždeň. Po uplynutí odkaz prestane fungovať.',
  },
  {
    title: 'Pošli safe-url.',
    body: 'Príjemca otvorí dočasný odkaz. Interný CDN kľúč nikdy neopustí server.',
  },
] as const

/** Pinned fragment that changes as each how-it-works step enters view. */
export function ShareStory() {
  const [active, setActive] = useState(0)
  const stepRefs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const nodes = stepRefs.current.filter(Boolean) as HTMLElement[]
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible?.target) return
        const index = Number((visible.target as HTMLElement).dataset.index)
        if (!Number.isNaN(index)) setActive(index)
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: [0.2, 0.5, 0.8] },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-story">
      <div className="landing-story-steps">
        {STEPS.map((step, index) => (
          <article
            key={step.title}
            className="landing-story-step"
            data-index={index}
            data-active={active === index}
            ref={(el) => {
              stepRefs.current[index] = el
            }}
          >
            {index === 0 ? (
              <p className="landing-section-head" style={{ marginBottom: 0 }}>
                Ako zdieľaš
              </p>
            ) : null}
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>

      <div className="landing-story-stage" aria-live="polite">
        <ShareFragment state={active} />
      </div>
    </div>
  )
}

function ShareFragment({ state }: { state: number }) {
  if (state === 0) {
    return (
      <div className="landing-safeurl" data-ui style={{ width: 'min(100%, 26rem)' }}>
        <p className="landing-safeurl-label">Vybraný súbor</p>
        <div className="landing-safeurl-file" data-active="true">
          <div>
            <strong>podklady-klient.pdf</strong>
            <span className="landing-safeurl-label" style={{ display: 'block' }}>
              1,1 MB · priečinok Klienti
            </span>
          </div>
        </div>
        <div className="landing-safeurl-file" style={{ opacity: 0.55 }}>
          <div>
            <strong>invoice-088.pdf</strong>
            <span className="landing-safeurl-label" style={{ display: 'block' }}>
              92 KB
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (state === 1) {
    return (
      <div className="landing-safeurl" data-ui style={{ width: 'min(100%, 26rem)' }}>
        <p className="landing-safeurl-label">Expirácia safe-url</p>
        <div className="landing-ttl">
          <button type="button">1 hodina</button>
          <button type="button" aria-pressed="true">
            24 hodín
          </button>
          <button type="button">7 dní</button>
        </div>
        <div className="landing-meta-row">
          <span>Revoke kedykoľvek</span>
          <span style={{ color: 'var(--lp-ui-chart)', fontWeight: 500 }}>
            rate limit 30/min
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-safeurl" data-ui style={{ width: 'min(100%, 26rem)' }}>
      <p className="landing-safeurl-label">Odkaz pripravený</p>
      <p className="landing-url-readout">
        mini.drive/s/<em>p9r2xm</em>
      </p>
      <div className="landing-meta-row">
        <span>Platí do zajtra 09:40</span>
        <span>0 otvorení</span>
      </div>
    </div>
  )
}
