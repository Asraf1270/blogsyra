'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useUploadThing } from '@/lib/uploadthing.client'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Unlink,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TiptapEditorProps {
  content: any
  onChange: (content: any) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onImageUpload?: (url: string) => void
}

interface LinkEditorProps {
  editor: Editor | null
  onClose: () => void
}

interface ImageUploadDialogProps {
  onImageInsert: (url: string) => void
}

const LinkEditor = ({ editor, onClose }: LinkEditorProps) => {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')

  useEffect(() => {
    if (editor?.isActive('link')) {
      const attrs = editor.getAttributes('link')
      setUrl(attrs.href || '')
      setText(editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to) || '')
    }
  }, [editor])

  const handleSetLink = () => {
    if (!url) {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      onClose()
      return
    }

    if (text && text !== url) {
      // Replace selected text with link text
      editor?.chain().focus().extendMarkRange('link').insertContent({
        type: 'text',
        text: text,
        marks: [{ type: 'link', attrs: { href: url, target: '_blank' } }]
      }).run()
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run()
    }
    onClose()
  }

  const handleRemoveLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    onClose()
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="link-url">URL</Label>
        <Input
          id="link-url"
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSetLink()
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-text">Link Text (Optional)</Label>
        <Input
          id="link-text"
          placeholder="Enter display text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSetLink} className="flex-1">
          {editor?.isActive('link') ? 'Update Link' : 'Insert Link'}
        </Button>
        {editor?.isActive('link') && (
          <Button onClick={handleRemoveLink} variant="destructive">
            <Unlink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

const ImageUploadDialog = ({ onImageInsert }: ImageUploadDialogProps) => {
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing('postImage', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        onImageInsert(res[0].url)
        setUploading(false)
      }
    },
    onUploadError: () => {
      setUploading(false)
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    await startUpload([file])
  }

  const handleUrlInsert = () => {
    if (url) {
      onImageInsert(url)
      setUrl('')
    }
  }

  return (
    <div className="space-y-4 p-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Uploading...' : 'Click or drag to upload'}
              </span>
            </label>
          </div>
        </TabsContent>
        <TabsContent value="url" className="space-y-4">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleUrlInsert} className="w-full">
            Insert Image
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const FloatingToolbar = ({ editor }: { editor: Editor | null }) => {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  if (!editor) return null

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    isActive = false, 
    disabled = false,
    label 
  }: { 
    onClick: () => void, 
    icon: any, 
    isActive?: boolean, 
    disabled?: boolean,
    label: string 
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-accent text-accent-foreground"
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )

  const headings = [
    { level: 1, icon: Heading1, label: 'Heading 1' },
    { level: 2, icon: Heading2, label: 'Heading 2' },
    { level: 3, icon: Heading3, label: 'Heading 3' },
  ]

  return (
    <div className="flex items-center gap-0.5 p-1 bg-background border rounded-lg shadow-sm">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={Bold}
        isActive={editor.isActive('bold')}
        label="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={Italic}
        isActive={editor.isActive('italic')}
        label="Italic"
      />
      
      <div className="w-px h-6 bg-border mx-1" />
      
      {headings.map(({ level, icon: Icon, label }) => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level: level as any }).run()}
          icon={Icon}
          isActive={editor.isActive('heading', { level })}
          label={label}
        />
      ))}
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={List}
        isActive={editor.isActive('bulletList')}
        label="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={ListOrdered}
        isActive={editor.isActive('orderedList')}
        label="Ordered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={Quote}
        isActive={editor.isActive('blockquote')}
        label="Blockquote"
      />
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogTrigger asChild>
          <ToolbarButton
            onClick={() => {}}
            icon={LinkIcon}
            isActive={editor.isActive('link')}
            label="Insert Link"
          />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <LinkEditor editor={editor} onClose={() => setIsLinkDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogTrigger asChild>
          <ToolbarButton
            onClick={() => {}}
            icon={ImageIcon}
            isActive={false}
            label="Insert Image"
          />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <ImageUploadDialog 
            onImageInsert={(url) => {
              editor.chain().focus().setImage({ src: url }).run()
              setIsImageDialogOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        icon={Undo}
        disabled={!editor.can().undo()}
        label="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        icon={Redo}
        disabled={!editor.can().redo()}
        label="Redo"
      />
    </div>
  )
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write your story...",
  editable = true,
  className,
  onImageUpload,
}: TiptapEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
          !editable && 'cursor-default',
          className
        ),
      },
    },
  })

  // Update content when prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Handle image upload from external source
  useEffect(() => {
    if (onImageUpload && editor) {
      const handleImageUpload = (url: string) => {
        editor.chain().focus().setImage({ src: url }).run()
      }
      // This allows parent components to trigger image insertion
      ;(window as any).__tiptap_insertImage = handleImageUpload
      return () => {
        delete (window as any).__tiptap_insertImage
      }
    }
  }, [editor, onImageUpload])

  if (!editor) {
    return (
      <div className="border rounded-lg p-4 min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div 
      ref={editorRef}
      className={cn(
        "border rounded-lg transition-all duration-200",
        isFocused && "ring-2 ring-primary/20 border-primary",
        !editable && "bg-muted/50"
      )}
    >
      {editable && (
        <div className="sticky top-0 z-10 p-2 border-b bg-background/95 backdrop-blur-sm rounded-t-lg">
          <FloatingToolbar editor={editor} />
        </div>
      )}
      <EditorContent editor={editor} />
      {!editable && (
        <div className="p-4 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            This content is in read-only mode
          </p>
        </div>
      )}
    </div>
  )
}