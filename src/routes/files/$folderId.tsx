import { createFileRoute, notFound } from '@tanstack/react-router'

import { FileExplorer } from '#/components/files/file-explorer'
import { AppShellPending } from '#/components/ui/preload-spinner'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { getAppChrome } from '#/server/functions/drive'
import { listFolderContents } from '#/server/functions/folders'

export const Route = createFileRoute('/files/$folderId')({
  beforeLoad: requireOnboardedSession,
  pendingComponent: function FolderPending() {
    return <AppShellPending label="Načítavam priečinok…" />
  },
  loader: async ({ params }) => {
    try {
      const [chrome, contents] = await Promise.all([
        getAppChrome(),
        listFolderContents({ data: { folderId: params.folderId } }),
      ])
      return { chrome, contents }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Priečinok neexistuje'
      ) {
        throw notFound()
      }
      throw error
    }
  },
  head: ({ loaderData, params }) => {
    const folderName =
      loaderData?.contents.breadcrumbs.at(-1)?.name ?? 'Priečinok'
    return privateAppHead(folderName, `/files/${params.folderId}`)
  },
  component: FilesFolderPage,
})

function FilesFolderPage() {
  const { folderId } = Route.useParams()
  const { chrome, contents } = Route.useLoaderData()

  return (
    <FileExplorer
      folderId={folderId}
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      stats={chrome.stats}
      initial={{
        folders: contents.folders,
        files: contents.files,
        breadcrumbs: contents.breadcrumbs,
        allFolders: chrome.folders,
        viewPreference: chrome.user.viewPreference,
        defaultShareExpiresIn: chrome.user.defaultShareExpiresIn,
        confirmDelete: chrome.user.confirmDelete,
      }}
    />
  )
}
