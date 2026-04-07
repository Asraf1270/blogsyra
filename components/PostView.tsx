'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useEffect } from 'react'

interface PostViewProps {
  content: any
}

export function PostView({ content }: PostViewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4 shadow-md',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: content,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-5/6" />
      </div>
    )
  }

  return <EditorContent editor={editor} />
}