'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Heart, Reply, MoreVertical, Loader2 } from 'lucide-react'
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
  type CommentWithReplies,
} from '@/lib/actions/comment-actions'

interface CommentsSectionProps {
  postId: string
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { isSignedIn, userId } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyToName, setReplyToName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())

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
      setReplyToName(null)
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

    setLikingComments(prev => new Set(prev).add(commentId))
    const result = await likeComment(commentId)
    
    if (result.success) {
      await loadComments()
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    
    setLikingComments(prev => {
      const newSet = new Set(prev)
      newSet.delete(commentId)
      return newSet
    })
  }

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo(commentId)
    setReplyToName(authorName)
    // Scroll to comment form
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const cancelReply = () => {
    setReplyTo(null)
    setReplyToName(null)
  }

  const CommentForm = () => (
    <div id="comment-form" className="space-y-3">
      {replyTo && replyToName && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm">
          <span>
            Replying to <span className="font-semibold">@{replyToName}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelReply}
            className="h-6 px-2"
          >
            Cancel
          </Button>
        </div>
      )}
      
      <Textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={replyTo ? "Write your reply..." : "Write a comment..."}
        rows={3}
        className="resize-none"
      />
      
      <div className="flex gap-2 justify-end">
        <Button
          onClick={handleSubmitComment}
          disabled={isSubmitting || !newComment.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Comment'
          )}
        </Button>
      </div>
    </div>
  )

  const CommentItem = ({ 
    comment, 
    depth = 0 
  }: { 
    comment: CommentWithReplies
    depth?: number 
  }) => {
    const [showReplyForm, setShowReplyForm] = useState(false)
    const isLiked = comment.isLiked || false
    const isLiking = likingComments.has(comment.id)

    return (
      <div className={`flex gap-3 ${depth > 0 ? 'ml-6 md:ml-12 mt-4' : 'mt-6'}`}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={comment.author.avatarUrl || undefined} />
          <AvatarFallback>
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {comment.author.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>
              
              {isSignedIn && userId === comment.author.clerkId && (
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
            
            <p className="text-sm break-words whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => handleLikeComment(comment.id)}
              disabled={isLiking}
            >
              <Heart 
                className={`h-3.5 w-3.5 transition-all ${
                  isLiked ? 'fill-red-500 text-red-500' : ''
                }`} 
              />
              <span>{comment._count.likes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-xs"
              onClick={() => {
                if (!isSignedIn) {
                  toast({
                    title: 'Sign in required',
                    description: 'Please sign in to reply',
                    variant: 'destructive',
                  })
                  return
                }
                setShowReplyForm(!showReplyForm)
                if (!showReplyForm) {
                  handleReply(comment.id, comment.author.name)
                } else {
                  cancelReply()
                }
              }}
            >
              <Reply className="h-3.5 w-3.5" />
              <span>Reply</span>
            </Button>
          </div>
          
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm />
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 animate-pulse" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 border-b pb-4">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          Comments ({comments.length})
        </h2>
      </div>
      
      {/* New Comment Form */}
      {isSignedIn ? (
        <CommentForm />
      ) : (
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">
            Join the conversation! Sign in to share your thoughts.
          </p>
          <Button asChild>
            <a href="/sign-in">Sign In to Comment</a>
          </Button>
        </div>
      )}
      
      {/* Comments List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
            <p className="text-muted-foreground">
              Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 md:ml-12">
                  {comment.replies.map((reply) => (
                    <CommentItem 
                      key={reply.id} 
                      comment={reply} 
                      depth={1}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}