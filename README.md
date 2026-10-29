# Mini Drive

Osobné úložisko súborov inšpirované S3 / Google Drive. TanStack Start + Clerk + UploadThing + Drizzle (SQLite) + shadcn/ui.

## Rozhodnutia stacku

| Oblasť            | Voľba                                         | Zdôvodnenie                                                                                           |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Auth              | **Clerk**                                     | Session + middleware pre TanStack Start; lokálny user sync v SQLite.                                  |
| DB                | **SQLite + Drizzle**                          | Zero-ops lokálne a vo Vitest; schéma je portable na Postgres.                                         |
| Mazanie priečinka | Rekurzívne so súhrnom                         | Drive-like UX; UT súbory sa mažú cez `UTApi.deleteFiles`.                                             |
| Safe-url          | Vlastný token `/s/$token` → krátky signed URL | Revoke/expirácia v DB; `uploadthingKey` nikdy na klienta.                                             |

## Požiadavky

- Node 22+
- pnpm 9+

## Inštalácia

```bash
pnpm install
cp .env.example .env.local
# nastav Clerk kľúče, APP_URL a UPLOADTHING_TOKEN
pnpm db:push
pnpm dev
```

Otvor [http://localhost:3000](http://localhost:3000).

## Production

### Premenné

| Premenná                       | Účel                                              |
| ------------------------------ | ------------------------------------------------- |
| `NODE_ENV=production`          | Prod režim (CSP, HSTS, env guards)                |
| `APP_URL`                      | Canonical URL, sitemap, robots, CSRF (`https://…`) |
| `DATABASE_URL`                 | Cesta k SQLite na persistent volume               |
| `CLERK_*` / `VITE_CLERK_*`     | Live Clerk kľúče + dashboard origins              |
| `UPLOADTHING_TOKEN`            | Upload + signed URL (ACL **private** v dashboarde) |
| `AUDIT_IP_PEPPER`              | Hash IP pri share audite (odporúčané)             |
| `BACKUP_ENCRYPTION_KEY`        | Šifrované `pnpm db:backup` / `db:restore`         |

Pri štarte procesu (`pnpm start`) chýbajúce povinné premenné spôsobia hard fail.

### Build & start

```bash
pnpm build
pnpm start   # srvx → dist/server/server.js + dist/client
```

Healthcheck: `GET /api/health` → `{ status: "ok", checks: { database: "ok" } }`.

### Docker

```bash
# VITE_CLERK_PUBLISHABLE_KEY musí byť pri builde (client embed)
docker compose up --build -d
```

SQLite je na volume `mini-drive-data` (`/data/mini-drive.db`). Pred deployom nastav v Clerk a UploadThing produkčný `APP_URL`.

### Checklist pred go-live

1. Clerk **live** kľúče + allowed origins / redirect URLs = `APP_URL`
2. UploadThing token + **private** ACL + produkčná app URL
3. Persistent disk pre SQLite (WAL)
4. `AUDIT_IP_PEPPER` + `BACKUP_ENCRYPTION_KEY`
5. Cron / job: `pnpm db:backup`
6. Over `/api/health`, `/robots.txt`, `/sitemap.xml`

SEO: `/sitemap.xml`, `/robots.txt`, `/site.webmanifest`, `/og.svg`.
Súkromné routy majú `noindex`; verejné sú `/`, `/sign-in`, `/sign-up`.
Security headers + CSRF sú v `src/start.ts`.

## Skripty

| Skript               | Popis                      |
| -------------------- | -------------------------- |
| `pnpm dev`           | Vývojový server            |
| `pnpm build`         | Produkčný build            |
| `pnpm start`         | Produkčný server (srvx)    |
| `pnpm typecheck`     | TypeScript                 |
| `pnpm lint`          | Biome lint                 |
| `pnpm format`        | Biome format               |
| `pnpm check`         | Biome check (lint+format)  |
| `pnpm test`          | Vitest raz                 |
| `pnpm test:watch`    | Vitest watch               |
| `pnpm test:coverage` | Coverage report            |
| `pnpm db:push`       | Aplikuj schému do SQLite   |
| `pnpm db:backup`     | Šifrovaný backup DB        |
| `pnpm db:studio`     | Drizzle Studio             |

## Architektúra

```
src/
  routes/           # file-based routing + beforeLoad guards + /s/$token
  components/       # UI (shadcn) + file explorer + share dialog
  server/functions/ # createServerFn mutácie (files, folders, shares)
  db/               # Drizzle schema + SQLite client
  lib/              # auth helpers, CSP, env, rate-limit, share tokens
```

Tok: `/` → session? → onboarded? → `/files` alebo `/onboarding` alebo `/sign-in`.

Verejný safe-url: `/s/$token` → rate limit → aktívny odkaz? → krátky UT signed URL (5 min) · inak **410**.

### UploadThing

Do `.env.local` doplň `UPLOADTHING_TOKEN` z [uploadthing.com](https://uploadthing.com/dashboard).
V dashboarde nastav ACL **private** (alebo povoľ override ACL per-request).

## Dizajn

Notion-inspired: svetlé UI, Figtree + Literata, accent `#2383e2`, jednoduchý sidebar a čistý file explorer. Dark mode cez theme toggle.
