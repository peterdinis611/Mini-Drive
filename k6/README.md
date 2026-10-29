# k6 load tests

HTTP load against a **running** Mini Drive instance (dev or prod). Pure Vitest stress tests live under `src/lib/__tests__/stress*.test.ts` — k6 hits the real server.

## Požiadavky

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) CLI (`brew install k6`)
- Bežiaca app: `pnpm dev` alebo `pnpm build && pnpm start`

## Scenáre

| Skript | Príkaz | Účel |
| ------ | ------ | ---- |
| `smoke.js` | `pnpm test:k6:smoke` | 2 VU / 20s — health, landing, robots, sitemap, missing share |
| `load.js` | `pnpm test:k6` | Ramp 0→25 VU — mix public endpoints |
| `spike.js` | `pnpm test:k6:spike` | Short spike na 50 VU |
| `share-rate.js` | `pnpm test:k6:share-rate` | 1 VU burst na `/s/*` — očakáva 429 po limite |

## Premenné

```bash
BASE_URL=http://127.0.0.1:3000 pnpm test:k6:smoke
BASE_URL=https://mini-drive.example pnpm test:k6
```

Default `BASE_URL` je `http://127.0.0.1:3000`.

## Poznámky

- Scenáre **nevolajú** autentifikované `/files` (Clerk) ani UploadThing upload.
- Missing share token je zámerne 410 (alebo 200 s gone UI) — nie 5xx.
- `share-rate.js` môže na chvíľu „zablokovať“ tvoj IP voči share resolve (30 req / min) — spúšťaj len lokálne.
