'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { PostForm } from '@/components/editor/PostForm'
import { useToast } from '@/components/ui/use-toast'

export default function CreatePostPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create post')

      const post = await response.json()
      
      toast({
        title: 'Success!',
        description: `Post ${data.status === 'PUBLISHED' ? 'published' : 'saved as draft'}`,
      })
      
      router.push(`/dashboard/posts/${post.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!userId) {
    return (
      <div className="container py-8 text-center">
        <p>Please sign in to create a post.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground">Share your story with the world</p>
      </div>
      <PostForm onSubmit={handleSubmit} />
    </div>
  )
}