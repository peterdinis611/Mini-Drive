'use client'

import { useState } from 'react'

export function PrivacySwitches() {
  const [acl, setAcl] = useState(true)
  const [audit, setAudit] = useState(true)

  return (
    <div className="landing-switch-panel" data-ui>
      <div className="landing-switch-row">
        <div>
          <strong>Private ACL</strong>
          <span>Súbor nie je verejný bez safe-url</span>
        </div>
        <button
          type="button"
          className="landing-toggle"
          role="switch"
          aria-checked={acl}
          aria-label="Private ACL"
          onClick={() => setAcl((v) => !v)}
        />
      </div>
      <div className="landing-switch-row">
        <div>
          <strong>Audit otvorení</strong>
          <span>Hashed IP pri každom kliknutí</span>
        </div>
        <button
          type="button"
          className="landing-toggle"
          role="switch"
          aria-checked={audit}
          aria-label="Audit otvorení"
          onClick={() => setAudit((v) => !v)}
        />
      </div>
      <p className="landing-safeurl-label" style={{ margin: 0 }}>
        Stav: {acl ? 'súkromné' : 'otvorené'} · audit{' '}
        {audit ? 'zapnutý' : 'vypnutý'}
      </p>
    </div>
  )
}

export function FolderQuotaPanel() {
  return (
    <div className="landing-folder-panel" data-ui>
      <div className="landing-folder-row" data-active="true">
        <span aria-hidden>▾</span>
        <span>Klientské zmluvy</span>
      </div>
      <div className="landing-folder-row landing-folder-indent">
        <span aria-hidden>·</span>
        <span>2025</span>
      </div>
      <div
        className="landing-folder-row landing-folder-indent"
        data-active="true"
      >
        <span aria-hidden>·</span>
        <span>2026</span>
      </div>
      <div className="landing-folder-row">
        <span aria-hidden>▸</span>
        <span>Fotky produktu</span>
      </div>
      <div className="landing-quota">
        <div className="landing-meta-row">
          <span>Kvóta</span>
          <strong style={{ color: 'var(--lp-ink)', fontWeight: 500 }}>
            6,2 / 100 GB
          </strong>
        </div>
        <div className="landing-quota-bar" aria-hidden>
          <i />
        </div>
      </div>
    </div>
  )
}

export function TrashRetentionPanel() {
  const [restored, setRestored] = useState(false)

  return (
    <div className="landing-trash-panel" data-ui>
      <div className="landing-trash-item">
        <strong style={{ fontWeight: 500 }}>brief-q3.pptx</strong>
        <button
          type="button"
          disabled={restored}
          onClick={() => setRestored(true)}
        >
          {restored ? 'Obnovené' : 'Obnoviť'}
        </button>
        <span className="landing-safeurl-label">
          Soft-delete · retenčia ešte 18 dní
        </span>
      </div>
      <div className="landing-trash-item">
        <strong style={{ fontWeight: 500 }}>moodboard-v2.zip</strong>
        <button type="button">Obnoviť</button>
        <span className="landing-safeurl-label">
          Soft-delete · retenčia ešte 4 dni
        </span>
      </div>
    </div>
  )
}
