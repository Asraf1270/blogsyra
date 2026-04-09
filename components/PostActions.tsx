'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Heart, Bookmark, Share2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLike, toggleBookmark, checkLikeStatus, checkBookmarkStatus } from '@/lib/actions/interaction-actions'
import { useToast } from '@/components/ui/use-toast'

interface PostActionsProps {
  postId: string
  initialLikes?: number
  slug: string
}

export function PostActions({ postId, initialLikes = 0, slug }: PostActionsProps) {
  const { isSignedIn } = useAuth()
  const { toast } = useToast()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      if (!isSignedIn) {
        setIsInitialLoading(false)
        return
      }
      
      const [likeResult, bookmarkResult] = await Promise.all([
        checkLikeStatus(postId),
        checkBookmarkStatus(postId),
      ])
      
      if (likeResult.success && likeResult.data) {
        setIsLiked(likeResult.data.isLiked)
        setLikes(likeResult.data.likesCount)
      }
      
      if (bookmarkResult.success && bookmarkResult.data) {
        setIsBookmarked(bookmarkResult.data.isBookmarked)
      }
      
      setIsInitialLoading(false)
    }
    
    checkStatus()
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
    // Optimistic update
    setIsLiked(!isLiked)
    setLikes(prev => isLiked ? prev - 1 : prev + 1)
    
    const result = await toggleLike(postId)
    
    if (!result.success) {
      // Revert on error
      setIsLiked(!isLiked)
      setLikes(prev => isLiked ? prev + 1 : prev - 1)
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
    // Optimistic update
    setIsBookmarked(!isBookmarked)
    
    const result = await toggleBookmark(postId)
    
    if (result.success) {
      toast({
        title: isBookmarked ? 'Removed' : 'Bookmarked',
        description: isBookmarked 
          ? 'Post removed from your bookmarks' 
          : 'Post saved to your bookmarks',
      })
    } else {
      // Revert on error
      setIsBookmarked(!isBookmarked)
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

  if (isInitialLoading) {
    return (
      <div className="flex items-center gap-4">
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant={isLiked ? 'default' : 'ghost'}
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 transition-all ${isLiked ? 'fill-current' : ''}`} />
        )}
        <span>{likes.toLocaleString()}</span>
      </Button>
      
      <Button
        variant={isBookmarked ? 'default' : 'ghost'}
        size="sm"
        onClick={handleBookmark}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={`h-4 w-4 transition-all ${isBookmarked ? 'fill-current' : ''}`} />
        )}
        <span className="hidden sm:inline">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      </Button>
      
      <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  )
}