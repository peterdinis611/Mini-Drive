import { Link, createFileRoute } from '@tanstack/react-router'
import { FileIcon, FolderOpen } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Button } from '#/components/ui/button'
import { EmptyState } from '#/components/ui/empty-state'
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
  const reduce = useReducedMotion()

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
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
          {recent.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="Zatiaľ prázdne"
              description="Po prvom uploade sa tu zobrazia najnovšie súbory."
              action={
                <Button asChild variant="outline">
                  <Link to="/files">Prejsť do súborov</Link>
                </Button>
              }
            />
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
                {recent.map((file, index) => (
                  <motion.tr
                    key={file.id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: [0.22, 1, 0.36, 1],
                      delay: reduce ? 0 : index * 0.045,
                    }}
                    className="border-b transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted"
                    whileHover={reduce ? undefined : { x: 2 }}
                  >
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
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </FadeIn>
    </AppShell>
  )
}
