import { createFileRoute, redirect } from '@tanstack/react-router'

import { FileExplorer } from '#/components/files/file-explorer'
import { getAppChrome } from '#/server/functions/drive'
import { listFolderContents } from '#/server/functions/folders'
import { getSession } from '#/server/session'

export const Route = createFileRoute('/files/$folderId')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) throw redirect({ to: '/login' })
    if (!session.user.onboardedAt) throw redirect({ to: '/onboarding' })
    return { session }
  },
  loader: async ({ params }) => {
    const [chrome, contents] = await Promise.all([
      getAppChrome(),
      listFolderContents({ data: { folderId: params.folderId } }),
    ])
    return { chrome, contents }
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
      }}
    />
  )
}
