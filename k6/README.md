# k6 load tests

HTTP load against a **running** Mini Drive instance (dev or prod). Pure Vitest stress tests live under `src/lib/__tests__/stress*.test.ts` — k6 hits the real server.

Skripty sú v **TypeScript** (k6 ≥ 0.57 stripuje typy cez esbuild). Typecheck: `pnpm test:k6:typecheck`.

## Požiadavky

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) CLI ≥ 0.57 (`brew install k6`)
- Bežiaca app: `pnpm dev` alebo `pnpm build && pnpm start`

## Scenáre

| Skript           | Príkaz                     | Účel                                                              |
| ---------------- | -------------------------- | ----------------------------------------------------------------- |
| `smoke.ts`       | `pnpm test:k6:smoke`       | 2 VU / 20s — public surfaces, gone share/embed, jeden guest guard |
| `load.ts`        | `pnpm test:k6`             | Ramp 0→25 VU — mix public + share/embed gone                      |
| `spike.ts`       | `pnpm test:k6:spike`       | Short spike na 50 VU (health + landing)                           |
| `soak.ts`        | `pnpm test:k6:soak`        | Sustained load (default 12 VU / 5m) — leak / pool pressure        |
| `stress.ts`      | `pnpm test:k6:stress`      | Ramp až ~80 VU — past normal capacity                             |
| `arrival.ts`     | `pnpm test:k6:arrival`     | Constant arrival rate (default 40 iter/s)                         |
| `static.ts`      | `pnpm test:k6:static`      | SEO + static assets (og, favicon, manifest, marketing)            |
| `auth-pages.ts`  | `pnpm test:k6:auth-pages`  | `/sign-in`, `/sign-up`, legacy `/login` + `/register`             |
| `health.ts`      | `pnpm test:k6:health`      | Focused `/api/health` — DB pool                                   |
| `guest-guard.ts` | `pnpm test:k6:guest-guard` | Private routes as guest — redirect / no 5xx                       |
| `share-rate.ts`  | `pnpm test:k6:share-rate`  | 1 VU burst na `/s/*` — očakáva 429 po limite                      |
| `embed-rate.ts`  | `pnpm test:k6:embed-rate`  | 1 VU burst na `/e/*` — očakáva 429 po limite                      |

## Premenné

```bash
BASE_URL=http://127.0.0.1:3000 pnpm test:k6:smoke
BASE_URL=https://mini-drive.example pnpm test:k6

# Soak / stress / arrival / health knobs
SOAK_VUS=20 SOAK_DURATION=10m pnpm test:k6:soak
STRESS_MAX_VUS=120 pnpm test:k6:stress
ARRIVAL_RATE=60 ARRIVAL_DURATION=2m pnpm test:k6:arrival
HEALTH_VUS=30 HEALTH_DURATION=2m pnpm test:k6:health
```

Default `BASE_URL` je `http://127.0.0.1:3000`.

## Poznámky

- Lokálne importy musia mať príponu `.ts` (k6 module resolver).
- Zdieľané helpery: `k6/lib/` (`checks`, `env`, `hit`, `paths`, `random`).
- Scenáre **nevolajú** autentifikované mutácie ani UploadThing upload.
- Missing share/embed token je zámerne 410 (alebo 200 s gone UI) — nie 5xx.
- `share-rate.ts` / `embed-rate.ts` môžu na chvíľu „zablokovať“ tvoj IP voči resolve (30 req / min) — spúšťaj len lokálne.
- `stress` má voľnejšie thresholdy — cieľom je nájsť bod zlomu, nie zelený CI.
