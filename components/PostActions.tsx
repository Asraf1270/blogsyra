'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Heart, Bookmark, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLike, toggleBookmark } from '@/lib/actions/interaction-actions'
import { useToast } from '@/components/ui/use-toast'

interface PostActionsProps {
  postId: string
  initialLikes: number
  initialBookmarks: number
  slug: string
}

export function PostActions({ postId, initialLikes, initialBookmarks, slug }: PostActionsProps) {
  const { isSignedIn } = useAuth()
  const { toast } = useToast()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user has liked/bookmarked (API call)
    const checkInteractions = async () => {
      if (!isSignedIn) return
      
      try {
        const response = await fetch(`/api/posts/${postId}/interactions`)
        const data = await response.json()
        setIsLiked(data.isLiked)
        setIsBookmarked(data.isBookmarked)
      } catch (error) {
        console.error('Error checking interactions:', error)
      }
    }
    
    checkInteractions()
  }, [postId, isSignedIn])

  const handleLike = async () => {
    if (!isSignedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like this post',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)
    const result = await toggleLike(postId)
    
    if (result.success) {
      setIsLiked(result.data.isLiked)
      setLikes(prev => result.data.isLiked ? prev + 1 : prev - 1)
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleBookmark = async () => {
    if (!isSignedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to bookmark this post',
        variant: 'destructive',
      })
      return
    }
    
    setIsLoading(true)
    const result = await toggleBookmark(postId)
    
    if (result.success) {
      setIsBookmarked(result.data.isBookmarked)
      toast({
        title: result.data.isBookmarked ? 'Bookmarked' : 'Removed',
        description: result.data.isBookmarked 
          ? 'Post saved to your bookmarks' 
          : 'Post removed from bookmarks',
      })
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${slug}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link copied!',
        description: 'Post link copied to clipboard',
      })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant={isLiked ? 'default' : 'ghost'}
          size="sm"
          onClick={handleLike}
          disabled={isLoading}
          className="gap-2"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likes.toLocaleString()}</span>
        </Button>
        
        <Button
          variant={isBookmarked ? 'default' : 'ghost'}
          size="sm"
          onClick={handleBookmark}
          disabled={isLoading}
          className="gap-2"
        >
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          <span>Save</span>
        </Button>
      </div>
      
      <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  )
}