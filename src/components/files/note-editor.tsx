'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react'

import { Separator } from '#/components/ui/separator'
import { Toggle } from '#/components/ui/toggle'
import { cn } from '#/lib/utils'

type Props = {
  value: string
  onChange: (html: string) => void
  editable?: boolean
  className?: string
  placeholder?: string
}

function isProbablyHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

/** TipTap rich-text editor for file notes (stores HTML). */
export function NoteEditor({
  value,
  onChange,
  editable = true,
  className,
  placeholder = 'Napíš poznámku…',
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2',
        },
      }),
    ],
    content: value
      ? isProbablyHtml(value)
        ? value
        : `<p>${escapeHtml(value)}</p>`
      : '',
    editable,
    editorProps: {
      attributes: {
        class:
          'note-editor-prose min-h-[140px] max-h-[280px] overflow-y-auto px-3 py-2 text-sm outline-none focus:outline-none',
        'aria-label': 'Editor poznámky',
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML()
      onChange(current.isEmpty ? '' : html)
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const next = value
      ? isProbablyHtml(value)
        ? value
        : `<p>${escapeHtml(value)}</p>`
      : ''
    if (normalizeHtml(current) === normalizeHtml(next || '<p></p>')) return
    editor.commands.setContent(next || '', { emitUpdate: false })
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  if (!editor) return null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-background',
        className,
      )}
    >
      {editable ? (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/80 bg-muted/30 px-1.5 py-1">
          <ToolbarButton
            label="Tučné"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Kurzíva"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Prečiarknuté"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Nadpis"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Zoznam"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Číslovaný zoznam"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Odkaz"
            active={editor.isActive('link')}
            onClick={() => {
              const previous = editor.getAttributes('link').href as
                | string
                | undefined
              const url = window.prompt('URL odkazu', previous ?? 'https://')
              if (url === null) return
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run()
            }}
          >
            <Link2 className="size-3.5" />
          </ToolbarButton>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <ToolbarButton
            label="Späť"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            label="Znova"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 className="size-3.5" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Toggle
      type="button"
      size="sm"
      pressed={Boolean(active)}
      aria-label={label}
      title={label}
      disabled={disabled}
      onPressedChange={() => onClick()}
      className="size-7 min-w-7 p-0 data-[state=on]:bg-primary/15 data-[state=on]:text-primary"
    >
      {children}
    </Toggle>
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function normalizeHtml(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}
