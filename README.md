# Mini Drive

Osobné úložisko súborov inšpirované S3 / Google Drive. TanStack Start + UploadThing + Better Auth + Drizzle (SQLite) + shadcn/ui.

## Rozhodnutia stacku

| Oblasť | Voľba | Zdôvodnenie |
| --- | --- | --- |
| Auth | **Better Auth** | Oficiálna integrácia s TanStack Start (`tanstackStartCookies`), `onboardedAt` priamo v `user` schéme. |
| DB | **SQLite + Drizzle** | Zero-ops lokálne a vo Vitest; schéma je portable na Postgres. |
| Mazanie priečinka | Rekurzívne so súhrnom | Drive-like UX; UT súbory sa mažú cez `UTApi.deleteFiles`. |
| Safe-url | Vlastný token `/s/$token` → krátky signed URL | Revoke/expirácia v DB; `uploadthingKey` nikdy na klienta. |

## Požiadavky

- Node 22+
- pnpm 9+

## Inštalácia

```bash
pnpm install
cp .env.example .env.local
# nastav BETTER_AUTH_SECRET (min. 32 znakov), APP_URL a UPLOADTHING_TOKEN
pnpm db:push
pnpm dev
```

Otvor [http://localhost:3000](http://localhost:3000).

## Production

| Premenná | Účel |
| --- | --- |
| `APP_URL` | Canonical URL, sitemap, robots, CSRF origin |
| `BETTER_AUTH_URL` | Auth callbacks (mal by byť rovnaký ako `APP_URL`) |
| `BETTER_AUTH_SECRET` | Session signing (min. 32 znakov) |
| `UPLOADTHING_TOKEN` | Upload + signed URL |
| `DATABASE_URL` | SQLite (alebo neskôr Postgres DSN) |

SEO endpointy: `/sitemap.xml`, `/robots.txt`, `/site.webmanifest`, `/og.svg`.
Súkromné routy majú `noindex`; verejné sú `/login` a `/register`.
Security headers + CSRF middleware sú v `src/start.ts`.

## Skripty

| Skript | Popis |
| --- | --- |
| `pnpm dev` | Vývojový server |
| `pnpm build` | Produkčný build |
| `pnpm typecheck` | TypeScript |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest raz |
| `pnpm test:watch` | Vitest watch |
| `pnpm test:coverage` | Coverage report |
| `pnpm db:push` | Aplikuj schému do SQLite |
| `pnpm db:studio` | Drizzle Studio |

## Architektúra

```
src/
  routes/           # file-based routing + beforeLoad guards + /s/$token
  components/       # UI (shadcn) + file explorer + share dialog
  server/functions/ # createServerFn mutácie (files, folders, shares)
  db/               # Drizzle schema + SQLite client
  lib/              # auth, validácia, rate-limit, share tokens
```

Tok: `/` → session? → onboarded? → `/files` alebo `/onboarding` alebo `/login`.

Verejný safe-url: `/s/$token` → rate limit → aktívny odkaz? → krátky UT signed URL (5 min) · inak **410**.

## Fázy

1. **Hotové:** scaffold, auth, onboarding wizard, guards, Vitest
2. **Hotové:** UploadThing (private ACL), multi-upload, file rename/move/delete/download
3. **Hotové:** priečinky (CRUD, rekurzívne mazanie so súhrnom), breadcrumbs, move + ochrana cyklov
4. **Hotové:** safe-url zdieľanie (`/s/$token`), expirácia, revoke, rate limit, 410

### UploadThing

Do `.env.local` doplň `UPLOADTHING_TOKEN` z [uploadthing.com](https://uploadthing.com/dashboard).
V dashboarde nastav ACL **private** (alebo povoľ override ACL per-request).

## Dizajn

Notion-inspired: svetlé UI, Figtree + Literata, accent `#2383e2`, jednoduchý sidebar a čistý file explorer. Dark mode cez theme toggle.
