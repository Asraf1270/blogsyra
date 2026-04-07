'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Heart, Reply, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import {
  createComment,
  deleteComment,
  likeComment,
  getComments,
} from '@/lib/actions/comment-actions'

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string
    avatarUrl: string | null
  }
  likes: number
  isLiked?: boolean
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isSignedIn, userId } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    setIsLoading(true)
    const result = await getComments(postId)
    if (result.success) {
      setComments(result.data)
    }
    setIsLoading(false)
  }

  const handleSubmitComment = async () => {
    if (!isSignedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to comment',
        variant: 'destructive',
      })
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)
    const result = await createComment({
      postId,
      content: newComment,
      parentId: replyTo,
    })

    if (result.success) {
      toast({
        title: 'Comment posted',
        description: 'Your comment has been published',
      })
      setNewComment('')
      setReplyTo(null)
      await loadComments()
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteComment(commentId)
    if (result.success) {
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been removed',
      })
      await loadComments()
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!isSignedIn) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like comments',
        variant: 'destructive',
      })
      return
    }

    const result = await likeComment(commentId)
    if (result.success) {
      await loadComments()
    }
  }

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const [showReply, setShowReply] = useState(false)

    return (
      <div className={`flex gap-3 ${depth > 0 ? 'ml-6 md:ml-12' : ''}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatarUrl || undefined} />
          <AvatarFallback>{comment.author.name[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-semibold text-sm">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {isSignedIn && userId === comment.author.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <p className="text-sm">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-3 mt-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
              onClick={() => handleLikeComment(comment.id)}
            >
              <Heart className="h-3 w-3" />
              <span>{comment.likes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1 text-xs"
              onClick={() => {
                setReplyTo(comment.id)
                setShowReply(true)
              }}
            >
              <Reply className="h-3 w-3" />
              <span>Reply</span>
            </Button>
          </div>
          
          {showReply && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleSubmitComment}
                onCancel={() => {
                  setReplyTo(null)
                  setShowReply(false)
                }}
                isSubmitting={isSubmitting}
                placeholder="Write a reply..."
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  const CommentForm = ({ 
    onSubmit, 
    onCancel, 
    isSubmitting, 
    placeholder 
  }: { 
    onSubmit: () => void
    onCancel?: () => void
    isSubmitting: boolean
    placeholder?: string
  }) => (
    <div className="space-y-3">
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={placeholder || "Write a comment..."}
        rows={3}
        className="resize-none"
      />
      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={isSubmitting || !newComment.trim()}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Comments ({comments.length})
        </h2>
      </div>
      
      {/* New Comment Form */}
      {isSignedIn ? (
        <CommentForm
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmitting}
          placeholder="What are your thoughts?"
        />
      ) : (
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please sign in to join the conversation
          </p>
          <Button asChild className="mt-2">
            <a href="/sign-in">Sign In</a>
          </Button>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}