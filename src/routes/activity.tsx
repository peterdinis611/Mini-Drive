import { createFileRoute } from '@tanstack/react-router'
import { Activity } from 'lucide-react'

import { AppShell } from '#/components/layout/app-shell'
import { FadeIn } from '#/components/motion/fade-in'
import { Badge } from '#/components/ui/badge'
import { EmptyState } from '#/components/ui/empty-state'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '#/components/ui/item'
import { AppShellPending } from '#/components/ui/preload-spinner'
import { requireOnboardedSession } from '#/lib/route-guards'
import { privateAppHead } from '#/lib/seo'
import { listActivity } from '#/server/functions/activity'
import { getAppChrome } from '#/server/functions/drive'

export const Route = createFileRoute('/activity')({
  beforeLoad: requireOnboardedSession,
  loader: async () => {
    const [chrome, events] = await Promise.all([getAppChrome(), listActivity()])
    return { chrome, events }
  },
  head: () => privateAppHead('Aktivita', '/activity'),
  pendingComponent: function ActivityPending() {
    return <AppShellPending label="Načítavam aktivitu…" />
  },
  component: ActivityPage,
})

function ActivityPage() {
  const { chrome, events } = Route.useLoaderData()

  return (
    <AppShell
      userName={chrome.user.name}
      userEmail={chrome.user.email}
      folders={chrome.folders}
      stats={chrome.stats}
      title="Aktivita"
      subtitle="Audit zmien v Drive"
    >
      <FadeIn>
        {events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Zatiaľ žiadna aktivita"
            description="Upload, rename, komentáre a zdieľania sa tu zobrazia."
          />
        ) : (
          <ItemGroup className="gap-2">
            {events.map((event) => (
              <Item
                key={event.id}
                variant="outline"
                className="rounded-2xl border-2 border-foreground/10 bg-card/70 dark:border-primary/25"
              >
                <ItemContent>
                  <ItemTitle className="text-sm">{event.summary}</ItemTitle>
                  <ItemDescription className="flex flex-wrap items-center gap-2 font-meta text-[11px]">
                    <Badge variant="secondary">{event.action}</Badge>
                    <span>{event.targetType}</span>
                    {event.targetId ? (
                      <span>{event.targetId.slice(0, 8)}…</span>
                    ) : null}
                    <span>{formatDate(event.createdAt)}</span>
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        )}
      </FadeIn>
    </AppShell>
  )
}

function formatDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
