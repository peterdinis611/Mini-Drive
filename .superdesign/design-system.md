# Mini Drive — Design System

## Product

Mini Drive is a personal cloud file manager: folders, uploads, previews, share links, recent files, settings. Audience: individuals who want a calm, fast workspace — not enterprise admin chrome.

Primary surfaces: Files explorer (list/grid), Recent, Shares, Settings, Auth/Onboarding.

## Current visual DNA (baseline to reproduce)

- Notion-inspired workspace: warm off-white `#f7f6f3`, ink `#37352f`, primary blue `#2383e2`
- Fonts: Figtree (UI) + Literata (display)
- Shell: left sidebar + sticky page header + content panels with soft borders
- Motion: Motion/React staggered reveals; optional Three.js atmospheric scenes on empty/auth

## Anti-slop constraints (redesign MUST obey)

- No purple-on-white / indigo glow gradients
- No Inter / Roboto / Arial / Space Grotesk
- No generic dashboard card grids, floating badge stickers, or neon glassmorphism
- Prefer one bold, intentional direction over safe mid AI aesthetic
- Keep product name **Mini Drive** as a hero-level brand signal on marketing/auth; inside app, brand lives in sidebar mark

## Redesign brief (user request)

User wants the application redesigned so it does **not** look like default AI slop. Keep product IA (sidebar, files, recent, shares, settings) but explore a sharper visual system.

### Direction A — Industrial / utilitarian archive

- Cool graphite surfaces, precise hairlines, monospace metadata, high-contrast ink
- Accent: single sharp signal color (electric cyan or safety orange — pick one, not both)
- Dense file list, tool-like chrome, zero decorative fluff

### Direction B — Editorial / magazine workspace

- Literata-forward typography, asymmetric header, generous whitespace
- Paper/ink palette with one bold accent; photo-like depth via grain, not glow
- File rows feel like an index/catalog, not a SaaS table

## Component language

- shadcn/Radix primitives remain the interaction model
- Buttons: solid primary for create/upload; ghost for chrome
- Tables: DataTable with mobile card collapse
- Empty states: scene + short copy, not illustration packs

## Motion

- High-impact page load with staggered reveals; restrained hover
- Respect reduced motion
- **No Three.js / WebGL** — empty states and atmospheres are CSS + Lucide only

## Canonical product pages (Industrial)

- `/files` — explorer
- `/recent` — Nedávne
- `/shares` — Zdieľania
- `/settings` — Nastavenia
