'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { PostForm } from '@/components/editor/PostForm'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const { userId } = useAuth()
  const { toast } = useToast()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${params.id}`)
        if (!response.ok) throw new Error('Post not found')
        const data = await response.json()
        setPost(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load post',
          variant: 'destructive',
        })
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchPost()
  }, [params.id, router, toast])

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to update post')

      toast({
        title: 'Success!',
        description: `Post ${data.status === 'PUBLISHED' ? 'published' : 'updated'}`,
      })
      
      router.push(`/dashboard/posts/${params.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update post. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!userId) {
    return (
      <div className="container py-8 text-center">
        <p>Please sign in to edit this post.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container py-8 text-center">
        <p>Post not found.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground">Update your story</p>
      </div>
      <PostForm 
        initialData={post} 
        onSubmit={handleSubmit}
      />
    </div>
  )
}