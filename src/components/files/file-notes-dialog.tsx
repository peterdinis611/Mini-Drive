'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, StickyNote, Trash2 } from 'lucide-react'
import { toast } from '#/lib/toast'

import { NoteEditor } from '#/components/files/note-editor'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { PreloadSpinner } from '#/components/ui/preload-spinner'
import { ScrollArea } from '#/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import { getErrorMessage } from '#/lib/errors'
import {
  addFileComment,
  deleteFileComment,
  getFileNote,
  listFileComments,
  updateFileNote,
} from '#/server/functions/notes'

type Props = {
  open: boolean
  fileId: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
}

export function FileNotesDialog({
  open,
  fileId,
  fileName,
  onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [noteKey, setNoteKey] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<
    Array<{
      id: string
      body: string
      authorName: string
      createdAt: Date | string | number
    }>
  >([])

  useEffect(() => {
    if (!open || !fileId) return
    let cancelled = false
    setLoading(true)
    void Promise.all([
      getFileNote({ data: { fileId } }),
      listFileComments({ data: { fileId } }),
    ])
      .then(([noteResult, commentRows]) => {
        if (cancelled) return
        setNote(noteResult.note ?? '')
        setNoteKey((key) => key + 1)
        setComments(commentRows)
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, fileId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="size-4" aria-hidden />
            Poznámky — {fileName}
          </DialogTitle>
          <DialogDescription>
            TipTap editor + komentáre (audit ide do Aktivity).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <PreloadSpinner label="Načítavam…" />
          </div>
        ) : (
          <Tabs defaultValue="note" className="gap-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="note">
                <StickyNote className="size-3.5" />
                Poznámka
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="size-3.5" />
                Komentáre
              </TabsTrigger>
            </TabsList>
            <TabsContent value="note" className="space-y-2">
              <NoteEditor
                key={`${fileId}-${noteKey}`}
                value={note}
                onChange={setNote}
                placeholder="Napíš poznámku k súboru…"
              />
              <Button
                type="button"
                size="sm"
                disabled={saving || !fileId}
                onClick={() => {
                  if (!fileId) return
                  setSaving(true)
                  const payload = note.trim() || null
                  void updateFileNote({
                    data: { fileId, note: payload },
                  })
                    .then(() => toast.success('Poznámka uložená'))
                    .catch((error) => toast.error(getErrorMessage(error)))
                    .finally(() => setSaving(false))
                }}
              >
                Uložiť poznámku
              </Button>
            </TabsContent>
            <TabsContent value="comments" className="space-y-2">
              <form
                className="space-y-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!fileId || !comment.trim()) return
                  void addFileComment({
                    data: { fileId, body: comment.trim() },
                  })
                    .then((created) => {
                      setComments((prev) => [
                        {
                          ...created,
                          authorName: 'Ty',
                        },
                        ...prev,
                      ])
                      setComment('')
                      toast.success('Komentár pridaný')
                    })
                    .catch((error) => toast.error(getErrorMessage(error)))
                }}
              >
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Nový komentár…"
                  aria-label="Nový komentár"
                  rows={3}
                />
                <Button type="submit">Pridať</Button>
              </form>
              <ScrollArea className="h-48">
                <ul className="m-0 list-none space-y-2 p-0 pr-3">
                  {comments.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      Zatiaľ bez komentárov.
                    </li>
                  ) : (
                    comments.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-border/70 bg-muted/15 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm">{item.body}</p>
                            <p className="font-meta text-[11px] text-muted-foreground">
                              {item.authorName} · {formatDate(item.createdAt)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-7 shrink-0"
                            aria-label="Zmazať komentár"
                            onClick={() => {
                              void deleteFileComment({
                                data: { commentId: item.id },
                              })
                                .then(() =>
                                  setComments((prev) =>
                                    prev.filter((row) => row.id !== item.id),
                                  ),
                                )
                                .catch((error) =>
                                  toast.error(getErrorMessage(error)),
                                )
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function formatDate(value: Date | string | number) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
