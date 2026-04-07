'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { CoverImageUpload } from '@/components/CoverImageUpload'
import { CategorySelect } from '@/components/CategorySelect'
import { TagMultiSelect } from '@/components/TagMultiSelect'
import { savePostDraft, publishPost } from '@/app/actions/post-actions'
import { Loader2, Save, Globe, Eye, Clock } from 'lucide-react'

// Form validation schema
const postSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform((str) => str.trim()),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase, hyphens only)')
    .transform((str) => str.toLowerCase().trim()),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform((str) => str?.trim() || ''),
  content: z.any().nullable(),
  coverImage: z.string().url('Invalid image URL').optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  publishedAt: z.date().optional().nullable(),
})

type PostFormData = z.infer<typeof postSchema>

// Auto-save debounce delay (8 seconds)
const AUTO_SAVE_DELAY = 8000
const STORAGE_KEY = 'blogsyra_post_draft'

export default function CreatePostPage() {
  const router = useRouter()
  const { userId, isSignedIn } = useAuth()
  const { toast } = useToast()
  const t = useTranslations('forms')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty: formIsDirty },
    reset,
    getValues,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: null,
      coverImage: null,
      categoryId: null,
      tagIds: [],
      isPublished: false,
      publishedAt: null,
    },
  })

  // Watch form values for auto-save
  const watchedValues = useWatch({ control })
  const isPublished = watch('isPublished')
  const title = watch('title')
  const slug = watch('slug')

  // Generate slug from title
  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setValue('slug', slug, { shouldDirty: true })
  }

  // Load draft from localStorage on mount
  useEffect(() => {
    if (!userId) return

    const loadDraft = async () => {
      try {
        const savedDraft = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
        if (savedDraft) {
          const draft = JSON.parse(savedDraft)
          const isRecent = Date.now() - draft.timestamp < 24 * 60 * 60 * 1000 // 24 hours
          
          if (isRecent && draft.data) {
            const shouldLoad = window.confirm(
              'You have an unsaved draft from ' + 
              new Date(draft.timestamp).toLocaleString() + 
              '. Do you want to restore it?'
            )
            
            if (shouldLoad) {
              reset(draft.data)
              toast({
                title: 'Draft Restored',
                description: 'Your previous draft has been loaded.',
              })
            } else {
              localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
            }
          } else {
            localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }

    loadDraft()
  }, [userId, reset, toast])

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!userId || !formIsDirty) return

    const formData = getValues()
    
    // Don't save empty posts
    if (!formData.title && !formData.content && !formData.excerpt) {
      return
    }

    setIsAutoSaving(true)
    
    try {
      // Save to localStorage first (offline backup)
      const draftData = {
        data: formData,
        timestamp: Date.now(),
        userId,
      }
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(draftData))
      
      // Save to server via Server Action
      const result = await savePostDraft(formData)
      
      if (result.success) {
        setLastSaved(new Date())
        setIsDirty(false)
        toast({
          title: 'Auto-saved',
          description: 'Your draft has been saved at ' + new Date().toLocaleTimeString(),
          duration: 2000,
        })
      } else {
        console.error('Auto-save failed:', result.error)
      }
    } catch (error) {
      console.error('Auto-save error:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [userId, formIsDirty, getValues, toast])

  // Debounced auto-save
  useEffect(() => {
    if (!userId) return
    
    const debounceTimer = setTimeout(() => {
      if (formIsDirty) {
        autoSave()
      }
    }, AUTO_SAVE_DELAY)

    return () => clearTimeout(debounceTimer)
  }, [watchedValues, autoSave, formIsDirty, userId])

  // Mark as dirty when form changes
  useEffect(() => {
    if (formIsDirty) {
      setIsDirty(true)
    }
  }, [formIsDirty])

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formIsDirty) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        autoSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [formIsDirty, autoSave])

  const onSubmit = async (data: PostFormData) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Please sign in to create a post.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await publishPost({
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      })

      if (result.success) {
        // Clear draft after successful publish
        localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
        
        toast({
          title: data.isPublished ? 'Post Published!' : 'Draft Saved!',
          description: data.isPublished 
            ? 'Your post is now live.' 
            : 'Your draft has been saved.',
        })
        
        router.push(data.isPublished ? `/blog/${result.slug}` : '/dashboard/posts')
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save post',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Redirect if not authenticated
  if (!isSignedIn) {
    return (
      <div className="container max-w-4xl py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to create a post.
        </p>
        <Button onClick={() => router.push('/sign-in')}>
          Sign In
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      {/* Header with auto-save indicator */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur-sm py-4 -mt-4 px-4 -mx-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create New Post</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Share your story with the world
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Auto-saving...</span>
              </div>
            )}
            {lastSaved && !isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4" />
                <span>Saved at {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
            {isDirty && !isAutoSaving && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title Section */}
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-base">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                onBlur={(e) => {
                  if (!slug) generateSlug(e.target.value)
                }}
                placeholder="Enter an engaging title..."
                className="mt-2 text-lg"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug" className="text-base">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-muted-foreground">
                  {typeof window !== 'undefined' && window.location.origin}/blog/
                </span>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="your-post-slug"
                  className="flex-1"
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                URL-friendly version of the title (lowercase, hyphens only)
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt" className="text-base">
                Excerpt
              </Label>
              <Textarea
                id="excerpt"
                {...register('excerpt')}
                placeholder="Write a brief summary of your post (max 500 characters)..."
                rows={3}
                className="mt-2"
              />
              <div className="flex justify-between mt-1">
                {errors.excerpt && (
                  <p className="text-sm text-destructive">{errors.excerpt.message}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {watch('excerpt')?.length || 0}/500 characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent>
            <CoverImageUpload
              value={watch('coverImage') || undefined}
              onChange={(url) => setValue('coverImage', url, { shouldDirty: true })}
            />
          </CardContent>
        </Card>

        {/* Categories & Tags */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategorySelect
                value={watch('categoryId') || undefined}
                onChange={(value) => setValue('categoryId', value, { shouldDirty: true })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <TagMultiSelect
                value={watch('tagIds')}
                onChange={(values) => setValue('tagIds', values, { shouldDirty: true })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={watch('content')}
              onChange={(value) => setValue('content', value, { shouldDirty: true })}
              placeholder="Write your amazing story here..."
            />
            {errors.content && (
              <p className="text-sm text-destructive mt-2">{errors.content.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Publish Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publish Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Publish Immediately</Label>
                <p className="text-sm text-muted-foreground">
                  Make this post visible to everyone
                </p>
              </div>
              <Switch
                checked={isPublished}
                onCheckedChange={(checked) => {
                  setValue('isPublished', checked, { shouldDirty: true })
                  if (checked) {
                    setValue('publishedAt', new Date())
                  }
                }}
              />
            </div>
            
            {isPublished && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <Globe className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your post will be published immediately and visible to everyone.
                </p>
              </div>
            )}
            
            {!isPublished && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <Eye className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your post will be saved as a draft. You can publish it later.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 -mb-4 px-4 -mx-4 border-t">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setValue('isPublished', false)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => setValue('isPublished', true)}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Globe className="h-4 w-4 mr-2" />
              )}
              Publish Post
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}