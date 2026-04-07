'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EditorField } from './EditorField'
import { CoverImageUpload } from '@/components/CoverImageUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  content: z.any().nullable(),
  coverImage: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  initialData?: Partial<PostFormData>
  onSubmit: (data: PostFormData) => Promise<void>
  isSubmitting?: boolean
}

export function PostForm({ initialData, onSubmit, isSubmitting = false }: PostFormProps) {
  const router = useRouter()
  const t = useTranslations('forms')
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      content: initialData?.content || null,
      coverImage: initialData?.coverImage || '',
      status: initialData?.status || 'DRAFT',
    },
  })

  const content = watch('content')
  const coverImage = watch('coverImage')

  const generateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setValue('slug', slug)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Title Section */}
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              onBlur={(e) => generateSlug(e.target.value)}
              placeholder="Enter post title"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="post-url-slug"
            />
            {errors.slug && (
              <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              {...register('excerpt')}
              placeholder="Brief description of your post (max 500 characters)"
              rows={3}
            />
            {errors.excerpt && (
              <p className="text-sm text-destructive mt-1">{errors.excerpt.message}</p>
            )}
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
            value={coverImage}
            onChange={(url) => setValue('coverImage', url)}
          />
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <EditorField
            label="Post Content"
            value={content}
            onChange={(value) => setValue('content', value)}
            error={errors.content}
            placeholder="Write your amazing content here..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          name="status"
          value="DRAFT"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          type="submit"
          name="status"
          value="PUBLISHED"
          variant="default"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </Button>
      </div>
    </form>
  )
}