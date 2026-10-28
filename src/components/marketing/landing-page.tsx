import { APP_NAME } from '#/lib/constants'

import { LandingCollage } from './fragments/landing-collage'
import { LandingThemeToggle } from './fragments/landing-theme-toggle'
import './landing.css'

const HERO_CARDS = [
  {
    id: 'folders',
    className: 'landing-card--a',
    caption: 'Priečinky v poriadku',
    Art: ArtFolders,
  },
  {
    id: 'safe-url',
    className: 'landing-card--b',
    caption: 'Safe-url zdieľanie',
    Art: ArtSafeUrl,
  },
  {
    id: 'quota',
    className: 'landing-card--c',
    caption: 'Viac miesta, menej chaosu',
    Art: ArtStack,
  },
  {
    id: 'archive',
    className: 'landing-card--d',
    caption: 'Skutočný archív',
    image: {
      src: '/marketing/filing-cabinet.jpg',
      alt: 'Čiernobiela fotografia archívnej skrine so šanónmi',
      width: 400,
      height: 420,
      loading: 'eager' as const,
    },
  },
  {
    id: 'private',
    className: 'landing-card--e',
    caption: 'Private by default',
    Art: ArtLock,
  },
] as const

const PRIVACY_ITEMS = [
  {
    title: 'Private ACL',
    body: 'Nič nie je public by default. Verejný prístup ide len cez dočasný safe-url.',
  },
  {
    title: 'Audit otvorení',
    body: 'Každé kliknutie s hashed IP. Vieš, kto otvoril — bez zbytočných PII.',
  },
  {
    title: 'Kôš s retenčou',
    body: 'Soft-delete, obnovenie a automatický výmaz po retenčnom okne.',
  },
  {
    title: 'Tvrdá kvóta',
    body: 'Vidíš GB namiesto nekonečného „cloud free“. Archív má hranice.',
  },
] as const

/**
 * Marketing landing — playful framed stage + collage / steps / CTA.
 */
export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-frame">
        <header className="landing-nav">
          <a className="landing-logo" href="/" aria-label={`${APP_NAME} — domov`}>
            Mini Drive
          </a>
          <div className="landing-nav-right">
            <nav className="landing-pill-nav" aria-label="Sekcie stránky">
              <a href="#archiv">Archív</a>
              <a href="#vsetko">Všetko</a>
              <a href="#ako">Ako</a>
              <a href="#sukromie">Súkromie</a>
            </nav>
            <LandingThemeToggle />
            <a className="landing-start" href="/sign-up">
              <span className="landing-start-label">Začať</span>
              <span className="landing-start-arrow" aria-hidden>
                →
              </span>
            </a>
          </div>
        </header>

        <main id="main-content">
          <section className="landing-hero" aria-labelledby="archiv">
            <div className="landing-bloom" aria-hidden />

            <header className="landing-center">
              <p className="landing-badge">Nahraj. Zoraď. Pošli safe-url.</p>
              <h1 id="archiv">Súbory jednoducho</h1>
              <p>
                Súkromný archív na nahrávanie, priečinky a dočasné odkazy — bez
                odhalenia interných kľúčov a bez verejného cloudu.
              </p>
              <a className="landing-cta" href="/sign-up">
                Začať nahrávať zadarmo
                <span className="landing-cta-arrow" aria-hidden>
                  →
                </span>
              </a>
            </header>

            <ul className="landing-card-rail" aria-label="Funkcie produktu">
              {HERO_CARDS.map((card) => (
                <li key={card.id} className="landing-card-item">
                  <figure className={`landing-card ${card.className}`}>
                    <div className="landing-card-art" aria-hidden={!('image' in card)}>
                      {'image' in card ? (
                        <img
                          src={card.image.src}
                          alt={card.image.alt}
                          width={card.image.width}
                          height={card.image.height}
                          loading={card.image.loading}
                        />
                      ) : (
                        <card.Art />
                      )}
                    </div>
                    <figcaption>{card.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="landing-block"
            id="vsetko"
            aria-labelledby="collage-title"
          >
            <header className="landing-block-head">
              <p className="landing-step-index">01 — 04</p>
              <h2 id="collage-title">Všetko na jednom mieste</h2>
            </header>

            <LandingCollage />

            <p className="landing-block-cta">
              <a className="landing-ghost-pill" href="/sign-up">
                Pripravený nahrávať
              </a>
            </p>
          </section>

          <section className="landing-block" id="ako" aria-labelledby="steps-title">
            <header className="landing-block-head">
              <p className="landing-step-index">02 — 04</p>
              <h2 id="steps-title">Tri ťahy do safe-url</h2>
            </header>

            <ol className="landing-steps">
              <li>
                <span className="landing-steps-num" aria-hidden>
                  01
                </span>
                <h3>Nahraj súbor</h3>
                <p>Drag & drop alebo výber. Súbor ide rovno do private ACL.</p>
              </li>
              <li>
                <span className="landing-steps-num" aria-hidden>
                  02
                </span>
                <h3>Nastav expiráciu</h3>
                <p>Hodina, deň alebo týždeň. Potom odkaz sám zomrie.</p>
              </li>
              <li>
                <span className="landing-steps-num" aria-hidden>
                  03
                </span>
                <h3>Pošli odkaz</h3>
                <p>Safe-url bez CDN kľúča. Revoke kedykoľvek jedným klikom.</p>
              </li>
            </ol>
          </section>

          <section
            className="landing-block landing-privacy"
            id="sukromie"
            aria-labelledby="privacy-title"
          >
            <header className="landing-block-head">
              <p className="landing-step-index">03 — 04</p>
              <h2 id="privacy-title">Súkromné, kým ty nerozhodneš</h2>
            </header>

            <ul className="landing-privacy-grid">
              {PRIVACY_ITEMS.map((item) => (
                <li key={item.title}>
                  <article>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                </li>
              ))}
            </ul>
          </section>

          <aside
            className="landing-final"
            aria-labelledby="final-title"
          >
            <p className="landing-badge">04 — 04</p>
            <h2 id="final-title">Postav si svoj archív</h2>
            <p>
              Účet zadarmo. Safe-url, priečinky, kôš a kvóta sú súčasť produktu.
            </p>
            <a className="landing-cta" href="/sign-up">
              Vytvoriť účet
              <span className="landing-cta-arrow" aria-hidden>
                →
              </span>
            </a>
          </aside>
        </main>

        <footer className="landing-foot">
          <p>Kôš · kvóta · verzie obrázkov</p>
          <nav aria-label="Účet">
            <a href="/sign-in">Prihlásenie</a>
            {' · '}
            <a href="/sign-up">Registrácia</a>
          </nav>
          <p>
            <small>
              © {new Date().getFullYear()} {APP_NAME}
            </small>
          </p>
        </footer>
      </div>
    </div>
  )
}

function ArtFolders() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="18"
        y="38"
        width="72"
        height="52"
        rx="10"
        fill="#c8f135"
        stroke="#0b1f2a"
        strokeWidth="3"
      />
      <path
        d="M28 38V30c0-4 3-7 7-7h18l6 8h26c4 0 7 3 7 7v0"
        fill="#9ad7ff"
        stroke="#0b1f2a"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="34"
        y="52"
        width="54"
        height="10"
        rx="3"
        fill="#0b1f2a"
        opacity="0.15"
      />
      <circle cx="88" cy="78" r="16" fill="#9ad7ff" stroke="#0b1f2a" strokeWidth="3" />
      <path
        d="M82 78h12M88 72v12"
        stroke="#0b1f2a"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArtSafeUrl() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="22"
        y="28"
        width="76"
        height="64"
        rx="14"
        fill="#fff"
        stroke="#0b1f2a"
        strokeWidth="3"
      />
      <rect x="34" y="44" width="52" height="12" rx="6" fill="#0b1f2a" />
      <rect x="34" y="64" width="34" height="10" rx="5" fill="#c8f135" />
      <circle cx="86" cy="84" r="18" fill="#9ad7ff" stroke="#0b1f2a" strokeWidth="3" />
      <path
        d="M78 84c0-4 3-8 8-8s8 4 8 8"
        stroke="#0b1f2a"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="86" cy="84" r="3" fill="#0b1f2a" />
    </svg>
  )
}

function ArtStack() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="28"
        y="24"
        width="64"
        height="18"
        rx="6"
        fill="#9ad7ff"
        stroke="#c8f135"
        strokeWidth="2.5"
      />
      <rect
        x="24"
        y="46"
        width="72"
        height="20"
        rx="6"
        fill="#e8fff0"
        stroke="#c8f135"
        strokeWidth="2.5"
      />
      <rect
        x="20"
        y="70"
        width="80"
        height="26"
        rx="6"
        fill="#c8f135"
        stroke="#c8f135"
        strokeWidth="2.5"
      />
      <text
        x="60"
        y="87"
        textAnchor="middle"
        fill="#071820"
        fontSize="10"
        fontFamily="Sora, sans-serif"
        fontWeight="700"
      >
        6,2 / 100 GB
      </text>
    </svg>
  )
}

function ArtLock() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="34"
        y="52"
        width="52"
        height="42"
        rx="12"
        fill="#c8f135"
        stroke="#c8f135"
        strokeWidth="2"
      />
      <path
        d="M44 52V42c0-10 7-18 16-18s16 8 16 18v10"
        stroke="#c8f135"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="72" r="6" fill="#0b1f2a" />
      <path
        d="M60 78v8"
        stroke="#0b1f2a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="90" cy="34" r="14" fill="#9ad7ff" opacity="0.95" />
    </svg>
  )
}
