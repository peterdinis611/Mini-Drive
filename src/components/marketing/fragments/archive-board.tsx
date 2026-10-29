'use client'

import { useState } from 'react'

const ROWS = [
  {
    name: 'zmluva-acme.pdf',
    size: '248 KB',
    updated: 'dnes 08:12',
    status: 'private',
    detail:
      'Private ACL. Posledný safe-url expiroval včera. Verzie: 3. Kvóta: 248 KB z 100 GB.',
  },
  {
    name: 'moodboard-v4.zip',
    size: '18,4 MB',
    updated: 'včera',
    status: 'shared',
    detail:
      'Aktívny safe-url do piatku. 4 otvorenia, 2 unique IP (hashed). Rate limit v norme.',
  },
  {
    name: 'faktura-088.pdf',
    size: '92 KB',
    updated: '27. 10.',
    status: 'private',
    detail: 'V priečinku Financie/2026. Žiadny verejný odkaz. Audit zapnutý.',
  },
  {
    name: 'produkt-hero.png',
    size: '2,1 MB',
    updated: '26. 10.',
    status: 'versioned',
    detail:
      'Orezaná verzia 1200×800 + originál. Soft-delete vypnutý. Pripravené na share.',
  },
  {
    name: 'brief-q4.docx',
    size: '410 KB',
    updated: '25. 10.',
    status: 'private',
    detail: 'Len vlastník. Žiadne zdieľanie. Posledná úprava od teba.',
  },
  {
    name: 'nahravka-call.m4a',
    size: '34 MB',
    updated: '24. 10.',
    status: 'trash',
    detail: 'V koši. Retenčná politika: ešte 11 dní do permanentného výmazu.',
  },
  {
    name: 'logo-pack.svg',
    size: '86 KB',
    updated: '22. 10.',
    status: 'shared',
    detail: 'Safe-url bez expirácie do 31. 12. Revoke jedným klikom.',
  },
  {
    name: 'scan-pas.pdf',
    size: '1,4 MB',
    updated: '20. 10.',
    status: 'private',
    detail: 'Citlivý dokument. Private by default, bez indexácie.',
  },
] as const

const STATUS_LABEL: Record<(typeof ROWS)[number]['status'], string> = {
  private: 'private',
  shared: 'safe-url',
  versioned: 'verzie',
  trash: 'kôš',
}

/** Full-width archive board — open a row for detail. */
export function ArchiveBoard() {
  const [open, setOpen] = useState(3)

  return (
    <section className="landing-board" aria-label="Ukážka archívu">
      <ul className="landing-board-list" data-ui>
        {ROWS.map((row, index) => {
          const isOpen = open === index
          return (
            <li key={row.name}>
              <button
                type="button"
                className="landing-board-row"
                data-open={isOpen}
                aria-expanded={isOpen}
                onClick={() => setOpen(index)}
              >
                <span className="landing-board-name">{row.name}</span>
                {!isOpen ? (
                  <>
                    <span className="landing-board-meta">{row.size}</span>
                    <span className="landing-board-meta">{row.updated}</span>
                    <span className="landing-board-status">
                      {STATUS_LABEL[row.status]}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="landing-board-detail">{row.detail}</p>
                    <span className="landing-board-status">
                      {STATUS_LABEL[row.status]} · {row.size} · {row.updated}
                    </span>
                  </>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
