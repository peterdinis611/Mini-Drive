# Routes

Framework: TanStack Router file-based routes under `src/routes/`.

| Path                        | File                   | Layout                    | Summary              |
| --------------------------- | ---------------------- | ------------------------- | -------------------- |
| `/`                         | `src/routes/index.tsx` | redirect/landing          | Entry                |
| `/login` `/register`        | auth routes            | AtmosphereShell           | Auth forms           |
| `/onboarding`               | onboarding             | Atmosphere                | Wizard               |
| `/files` `/files/$folderId` | files routes           | AppShell via FileExplorer | Main drive UI        |
| `/recent`                   | recent.tsx             | AppShell                  | Recent uploads table |
| `/shares`                   | shares.tsx             | AppShell                  | Share links table    |
| `/settings`                 | settings.tsx           | AppShell                  | Preferences          |
| `/s/$token`                 | public share           | Atmosphere                | Shared file access   |

Primary redesign target: **Files explorer** (`FileExplorer` + `AppShell` + `AppSidebar`).
