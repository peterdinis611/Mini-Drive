import { Link, createFileRoute } from '@tanstack/react-router'
import { FileIcon, FolderOpen } from 'lucide-react'

import { FadeIn } from '#/components/motion/fade-in'
import { AppShell } from '#/components/layout/app-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatFileSize } from '#/lib/format'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { getAppChrome, listRecentFiles } from '#/server/functions/drive'

export const Route = createFileRoute('/recent')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, recent] = await Promise.all([
      getAppChrome(),
      listRecentFiles(),
    ])
    return { chrome, recent }
  },
  head: () => privateAppHead('Nedávne', '/recent'),
  component: RecentPage,
})

function RecentPage() {
  const { chrome, recent } = Route.useLoaderData()

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Nedávne"
      subtitle="Posledných 40 nahratých súborov"
    >
      <FadeIn>
      <section>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FolderOpen className="size-8 text-muted-foreground" />
            <h2 className="text-lg font-medium">Zatiaľ prázdne</h2>
            <p className="text-sm text-muted-foreground">
              Po prvom uploade sa tu zobrazia najnovšie súbory.
            </p>
            <Link to="/files" className="text-sm text-primary underline-offset-4 hover:underline">
              Prejsť do súborov
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Názov</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Veľkosť</TableHead>
                <TableHead>Dátum</TableHead>
                <TableHead>Umiestnenie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 font-medium">
                      <FileIcon className="size-4 text-muted-foreground" />
                      {file.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {file.mimeType}
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    {new Date(file.createdAt).toLocaleString('sk-SK')}
                  </TableCell>
                  <TableCell>
                    {file.folderId ? (
                      <Link
                        to="/files/$folderId"
                        params={{ folderId: file.folderId }}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Otvoriť priečinok
                      </Link>
                    ) : (
                      <Link
                        to="/files"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Súbory
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      </FadeIn>
    </AppShell>
  )
}
