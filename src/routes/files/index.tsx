import { createFileRoute } from '@tanstack/react-router'

import { FileExplorer } from '#/components/files/file-explorer'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { getAppChrome } from '#/server/functions/drive'
import { listFolderContents } from '#/server/functions/folders'

export const Route = createFileRoute('/files/')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, contents] = await Promise.all([
      getAppChrome(),
      listFolderContents({ data: { folderId: null } }),
    ])
    return { chrome, contents }
  },
  head: () => privateAppHead('Súbory'),
  component: FilesRootPage,
})

function FilesRootPage() {
  const { chrome, contents } = Route.useLoaderData()

  return (
    <FileExplorer
      folderId={null}
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      stats={chrome.stats}
      initial={{
        folders: contents.folders,
        files: contents.files,
        breadcrumbs: contents.breadcrumbs,
        allFolders: chrome.folders,
        viewPreference: chrome.user.viewPreference,
      }}
    />
  )
}
