'use client'

import { TiptapEditor } from './TiptapEditor'

interface PostViewProps {
  content: any
  className?: string
}

export function PostView({ content, className }: PostViewProps) {
  return (
    <div className={className}>
      <TiptapEditor
        content={content}
        onChange={() => {}}
        editable={false}
        placeholder=""
      />
    </div>
  )
}