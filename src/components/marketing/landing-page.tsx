import { FolderTree, Link2, Shield, Trash2 } from 'lucide-react'

import { AtmosphereBackdrop } from '#/components/layout/atmosphere-backdrop'
import { Button } from '#/components/ui/button'
import { APP_NAME } from '#/lib/constants'
import { SITE } from '#/lib/site'

const FEATURES = [
  {
    icon: Shield,
    title: 'Súkromné by default',
    body: 'Súbory sú private ACL. Verejné odkazy idú cez dočasný safe-url, nie cez raw CDN kľúč.',
  },
  {
    icon: FolderTree,
    title: 'Archív a organizácia',
    body: 'Priečinky, vyhľadávanie, verzie obrázkov a tvrdá kvóta úložiska.',
  },
  {
    icon: Link2,
    title: 'Kontrolované zdieľanie',
    body: 'Expirácia, revoke, rate limit a audit otvorení s hashed IP.',
  },
  {
    icon: Trash2,
    title: 'Kôš s retenčou',
    body: 'Soft-delete, obnovenie a automatická retenčná politika pred permanentným výmazom.',
  },
] as const

/**
 * Static marketing surface — no client hooks.
 * Safe to render via `renderServerComponent`.
 */
export function LandingPage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden">
      <AtmosphereBackdrop intensity="bold" />
      <div className="status-page-rail" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground">
          <span className="flex size-8 items-center justify-center rounded-sm bg-primary font-mono text-xs font-bold text-primary-foreground">
            M
          </span>
          {APP_NAME}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-sm">
            <a href="/login">Prihlásenie</a>
          </Button>
          <Button asChild size="sm" className="rounded-sm">
            <a href="/register">Registrácia</a>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 pb-16 sm:px-10">
        <div className="space-y-5">
          <p className="font-mono text-[11px] tracking-[0.28em] text-primary uppercase">
            {APP_NAME} · industrial archive
          </p>
          <h1 className="max-w-[16ch] text-[clamp(2.4rem,7vw,3.75rem)] leading-[1.02] font-semibold tracking-tight text-foreground">
            {SITE.tagline}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {SITE.description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-sm">
              <a href="/register">Začať zadarmo</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-sm">
              <a href="/login">Prihlásenie</a>
            </Button>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <li
                key={feature.title}
                className="rounded-sm border border-border/80 bg-card/50 p-4 backdrop-blur-sm"
              >
                <Icon className="mb-3 size-5 text-primary" aria-hidden />
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </li>
            )
          })}
        </ul>

        <p className="font-mono text-[11px] tracking-wide text-muted-foreground/70">
          {APP_NAME} · {SITE.shortDescription}
        </p>
      </main>
    </div>
  )
}
