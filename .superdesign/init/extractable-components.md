# Extractable components

## AppShell

- Source: `src/components/layout/app-shell.tsx`
- Category: layout
- Description: Main app chrome with sidebar, mobile sheet, page header, actions slot
- Extractable props: title (string), subtitle (string), activeFolderId (string|null)
- Hardcoded: collapse controls, APP_NAME, motion transitions

## AppSidebar

- Source: `src/components/layout/app-sidebar.tsx`
- Category: layout
- Description: Left nav with brand, nav links, folder tree, storage stats, user
- Extractable props: activeFolderId, userName, stats
- Hardcoded: nav item labels/icons, storage bar

## FolderTree

- Source: `src/components/layout/folder-tree.tsx`
- Category: layout
- Description: Nested folder navigation tree
- Extractable props: folders, activeFolderId
- Hardcoded: Folder icons, expand affordances

## EmptyState

- Source: `src/components/ui/empty-state.tsx`
- Category: basic
- Description: Empty/zero-state panel with optional Three.js scene
- Extractable props: title, description, scene
- Hardcoded: scene mapping
