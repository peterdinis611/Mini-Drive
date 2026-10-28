import { Link } from '@tanstack/react-router'

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
          <Link
            className="landing-logo"
            to="/"
            preload="intent"
            aria-label={`${APP_NAME} — domov`}
          >
            Mini Drive
          </Link>
          <div className="landing-nav-right">
            <nav className="landing-pill-nav" aria-label="Sekcie stránky">
              <Link to="/" hash="archiv" preload={false}>
                Archív
              </Link>
              <Link to="/" hash="vsetko" preload={false}>
                Všetko
              </Link>
              <Link to="/" hash="ako" preload={false}>
                Ako
              </Link>
              <Link to="/" hash="sukromie" preload={false}>
                Súkromie
              </Link>
            </nav>
            <LandingThemeToggle />
            <Link className="landing-start" to="/sign-up/$" preload="intent">
              <span className="landing-start-label">Začať</span>
              <span className="landing-start-arrow" aria-hidden>
                <ArrowGlyph />
              </span>
            </Link>
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
              <Link className="landing-cta" to="/sign-up/$" preload="intent">
                Začať nahrávať zadarmo
                <span className="landing-cta-arrow" aria-hidden>
                  <ArrowGlyph />
                </span>
              </Link>
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
              <Link
                className="landing-ghost-pill"
                to="/sign-up/$"
                preload="intent"
              >
                Pripravený nahrávať
              </Link>
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
            <Link className="landing-cta" to="/sign-up/$" preload="intent">
              Vytvoriť účet
              <span className="landing-cta-arrow" aria-hidden>
                <ArrowGlyph />
              </span>
            </Link>
          </aside>
        </main>

        <footer className="landing-foot">
          <p>Kôš · kvóta · verzie obrázkov</p>
          <nav aria-label="Účet">
            <Link to="/sign-in/$" preload="intent">
              Prihlásenie
            </Link>
            {' · '}
            <Link to="/sign-up/$" preload="intent">
              Registrácia
            </Link>
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

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path
        d="M3 8h9M8 3.5 12.5 8 8 12.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArtFolders() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="16"
        y="36"
        width="76"
        height="56"
        rx="12"
        fill="#b6ec2e"
        stroke="#071820"
        strokeWidth="3.5"
      />
      <path
        d="M26 36V28c0-4 3-7 7-7h20l7 9h28c4 0 7 3 7 7v0"
        fill="#7eb8ff"
        stroke="#071820"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <rect x="32" y="52" width="56" height="11" rx="4" fill="#071820" opacity="0.18" />
      <circle cx="90" cy="82" r="18" fill="#7eb8ff" stroke="#071820" strokeWidth="3.5" />
      <path
        d="M82 82h16M90 74v16"
        stroke="#071820"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ArtSafeUrl() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="18"
        y="24"
        width="78"
        height="68"
        rx="16"
        fill="#f6faf7"
        stroke="#071820"
        strokeWidth="3.5"
      />
      <rect x="30" y="40" width="54" height="13" rx="6" fill="#071820" />
      <rect x="30" y="60" width="36" height="11" rx="5" fill="#b6ec2e" stroke="#071820" strokeWidth="2" />
      <circle cx="88" cy="86" r="20" fill="#7eb8ff" stroke="#071820" strokeWidth="3.5" />
      <path
        d="M78 86c0-5.5 4-10 10-10s10 4.5 10 10"
        stroke="#071820"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="88" cy="86" r="4" fill="#071820" />
    </svg>
  )
}

function ArtStack() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect
        x="26"
        y="20"
        width="68"
        height="20"
        rx="7"
        fill="#7eb8ff"
        stroke="#b6ec2e"
        strokeWidth="3"
      />
      <rect
        x="22"
        y="44"
        width="76"
        height="22"
        rx="7"
        fill="#e8fff0"
        stroke="#b6ec2e"
        strokeWidth="3"
      />
      <rect
        x="18"
        y="68"
        width="84"
        height="30"
        rx="8"
        fill="#b6ec2e"
        stroke="#071820"
        strokeWidth="2.5"
      />
      <text
        x="60"
        y="88"
        textAnchor="middle"
        fill="#071820"
        fontSize="11"
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
      <path
        d="M42 52V40c0-11 8-20 18-20s18 9 18 20v12"
        stroke="#b6ec2e"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect
        x="32"
        y="50"
        width="56"
        height="46"
        rx="14"
        fill="#b6ec2e"
        stroke="#071820"
        strokeWidth="3"
      />
      <circle cx="60" cy="72" r="7" fill="#071820" />
      <path
        d="M60 79v10"
        stroke="#071820"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="92" cy="32" r="15" fill="#7eb8ff" stroke="#071820" strokeWidth="3" />
    </svg>
  )
}
