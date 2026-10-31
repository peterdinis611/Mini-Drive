'use client'

import { useEffect, useRef } from 'react'

const RECENT = [
  { name: 'brief-q4.pdf', meta: '412 KB · pred 2 min', tone: 'pdf' },
  { name: 'moodboard.zip', meta: '18 MB · pred 14 min', tone: 'zip' },
  { name: 'hero-crop.png', meta: '2,1 MB · pred 1 h', tone: 'img' },
  { name: 'zmluva.docx', meta: '88 KB · včera', tone: 'doc' },
] as const

/**
 * Animated “everything in one place” collage — float + light scroll parallax.
 */
export function LandingCollage() {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = [...stage.querySelectorAll<HTMLElement>('[data-parallax]')]
    let raf = 0

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect()
        const mid = window.innerHeight * 0.45
        const delta = (rect.top + rect.height / 2 - mid) / window.innerHeight
        for (const el of items) {
          const depth = Number(el.dataset.parallax) || 12
          el.style.translate = `0 ${(-delta * depth).toFixed(1)}px`
        }
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section
      className="landing-collage-stage"
      ref={stageRef}
      aria-label="Ukážka archívu"
    >
      <article
        className="landing-ui-card landing-ui-card--recent landing-bob"
        data-parallax="18"
        style={{ animationDelay: '0s' }}
      >
        <header>
          <h3>Nedávne nahratia</h3>
          <span aria-hidden>↗</span>
        </header>
        <ul>
          {RECENT.map((row) => (
            <li key={row.name}>
              <span
                className={`landing-file-dot landing-file-dot--${row.tone}`}
                aria-hidden
              />
              <p>
                <strong>{row.name}</strong>
                <small>{row.meta}</small>
              </p>
            </li>
          ))}
        </ul>
      </article>

      <article
        className="landing-ui-card landing-ui-card--chart landing-bob"
        data-parallax="28"
        style={{ animationDelay: '0.35s' }}
      >
        <header>
          <h3>Úložisko</h3>
          <em>+0,4 GB</em>
        </header>
        <p className="landing-chart-total">
          <data value="6.2">6,2</data>
          {' / '}
          <data value="100">100 GB</data>
        </p>
        <div className="landing-bars" aria-hidden>
          <i style={{ height: '42%' }} />
          <i style={{ height: '68%' }} />
          <i style={{ height: '55%' }} />
          <i style={{ height: '88%' }} />
          <i style={{ height: '72%' }} />
        </div>
      </article>

      <aside
        className="landing-stack-panel landing-bob"
        data-parallax="10"
        style={{ animationDelay: '0.7s' }}
        aria-hidden
      >
        <FileToken
          className="landing-token landing-token--a"
          label="PDF"
          fill="#5b8fff"
        />
        <FileToken
          className="landing-token landing-token--b"
          label="ZIP"
          fill="#9ad7ff"
        />
        <FileToken
          className="landing-token landing-token--c"
          label="PNG"
          fill="#9ad7ff"
        />
        <FileToken
          className="landing-token landing-token--d"
          label="DOC"
          fill="#ffd27a"
        />
      </aside>

      <figure
        className="landing-photo-tile landing-bob"
        data-parallax="22"
        style={{ animationDelay: '0.15s' }}
      >
        <img
          src="/marketing/filing-cabinet.jpg"
          alt="Archívna skriňa so šanónmi v kancelárii"
          width={910}
          height={960}
          loading="lazy"
          decoding="async"
        />
        <figcaption className="sr-only">
          Fyzický archív ako metafora produktu
        </figcaption>
      </figure>

      <figure
        className="landing-photo-tile landing-photo-tile--sky landing-bob"
        data-parallax="14"
        style={{ animationDelay: '0.55s' }}
      >
        <img
          src="/marketing/twilight-ridge.jpg"
          alt="Krajina pri súmraku — pokojný priestor pre tvoje súbory"
          width={900}
          height={1200}
          loading="lazy"
        />
        <figcaption className="sr-only">
          Atmosféra súkromného archívu
        </figcaption>
      </figure>

      <aside
        className="landing-fun-tile landing-bob"
        data-parallax="32"
        style={{ animationDelay: '0.9s' }}
        aria-hidden
      >
        <span className="landing-fun-mark">+</span>
        <p>Drag & drop. Hotovo.</p>
      </aside>
    </section>
  )
}

function FileToken({
  className,
  label,
  fill,
}: {
  className: string
  label: string
  fill: string
}) {
  return (
    <div className={className} style={{ background: fill }}>
      <span>{label}</span>
    </div>
  )
}
