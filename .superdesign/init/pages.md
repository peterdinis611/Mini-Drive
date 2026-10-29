# Pages — dependency trees

## /files (File Explorer — primary redesign target)

Entry: `src/routes/files/index.tsx` → `src/components/files/file-explorer.tsx`
Dependencies:
- src/components/files/file-explorer.tsx
  - src/components/layout/app-shell.tsx
    - src/components/layout/app-sidebar.tsx
      - src/components/layout/folder-tree.tsx
      - src/components/ui/button.tsx
      - src/components/ui/progress.tsx
      - src/components/ui/scroll-area.tsx
      - src/components/ui/separator.tsx
      - src/components/ui/avatar.tsx - src/components/ui/sheet.tsx - src/components/ui/tooltip.tsx
  - src/components/files/upload-zone.tsx
  - src/components/files/folder-drop-target.tsx
  - src/components/files/file-thumbnail.tsx
  - src/components/files/file-preview-dialog.tsx
    - src/components/files/previews/file-preview-body.tsx
  - src/components/files/drive-search-dialog.tsx
  - src/components/ui/data-table.tsx
  - src/components/ui/breadcrumb.tsx
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/empty-state.tsx
  - src/components/ui/skeleton.tsx
  - src/components/motion/fade-in.tsx
  - src/components/motion/stagger.tsx
  - src/styles.css

## /recent

Entry: `src/routes/recent.tsx`
Dependencies:
- src/routes/recent.tsx
  - src/components/layout/app-shell.tsx (same shell tree)
  - src/components/ui/data-table.tsx
  - src/components/ui/empty-state.tsx
  - src/components/motion/fade-in.tsx

## /shares

Entry: `src/routes/shares.tsx`
Dependencies:
- src/routes/shares.tsx
  - src/components/layout/app-shell.tsx
  - src/components/ui/data-table.tsx
  - src/components/ui/button.tsx
  - src/components/ui/empty-state.tsx

## /settings

Entry: `src/routes/settings.tsx`
Dependencies:
- src/routes/settings.tsx
  - src/components/layout/app-shell.tsx
  - form controls (button, input, label, checkbox)

## /login

Entry: `src/routes/login.tsx`
Dependencies:
- src/routes/login.tsx
  - src/components/layout/atmosphere-shell.tsx
  - src/components/auth/auth-form.tsx
  - src/components/three/* (orbit-field / atmosphere backdrop)

## /onboarding

Entry: `src/routes/onboarding.tsx`
Dependencies:
- src/components/onboarding/onboarding-wizard.tsx
  - atmosphere + motion + form UI
