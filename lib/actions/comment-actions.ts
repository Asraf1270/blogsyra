'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parentId: z.string().nullable().optional(),
})

const deleteCommentSchema = z.object({
  commentId: z.string().min(1),
})

const likeCommentSchema = z.object({
  commentId: z.string().min(1),
})

export type CommentWithReplies = {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  isEdited: boolean
  author: {
    id: string
    name: string
    avatarUrl: string | null
    clerkId: string
  }
  _count: {
    likes: number
  }
  isLiked?: boolean
  replies?: CommentWithReplies[]
}

export async function getComments(postId: string) {
  try {
    const { userId } = await auth()
    
    // Get current user for like status
    let currentUser = null
    if (userId) {
      currentUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      })
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clerkId: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                clerkId: true,
              },
            },
            _count: {
              select: { likes: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Add like status and format replies
    const commentsWithLikeStatus = await Promise.all(
      comments.map(async (comment) => {
        let isLiked = false
        if (currentUser) {
          const like = await prisma.like.findFirst({
            where: {
              commentId: comment.id,
              userId: currentUser.id,
            },
          })
          isLiked = !!like
        }

        const repliesWithStatus = comment.replies.map((reply) => ({
          ...reply,
          isLiked: false, // You can implement reply like status similarly
        }))

        return {
          ...comment,
          isLiked,
          replies: repliesWithStatus,
        }
      })
    )

    return { success: true, data: commentsWithLikeStatus }
  } catch (error) {
    console.error('Error fetching comments:', error)
    return { 
      success: false, 
      data: [], 
      error: error instanceof Error ? error.message : 'Failed to load comments' 
    }
  }
}

export async function createComment(data: z.infer<typeof createCommentSchema>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = createCommentSchema.parse(data)

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        authorId: user.id,
        postId: validatedData.postId,
        parentId: validatedData.parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            clerkId: true,
          },
        },
      },
    })

    revalidatePath(`/blog/${validatedData.postId}`)
    
    return { success: true, data: comment }
  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create comment' 
    }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = deleteCommentSchema.parse({ commentId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const comment = await prisma.comment.findUnique({
      where: { id: validatedData.commentId },
      select: { authorId: true, postId: true },
    })

    if (!comment) {
      return { success: false, error: 'Comment not found' }
    }

    if (comment.authorId !== user.id) {
      return { success: false, error: 'You can only delete your own comments' }
    }

    // Delete all replies first (cascade will handle if set in schema)
    await prisma.comment.deleteMany({
      where: { parentId: validatedData.commentId },
    })

    await prisma.comment.delete({
      where: { id: validatedData.commentId },
    })

    revalidatePath(`/blog/${comment.postId}`)
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete comment' 
    }
  }
}

export async function likeComment(commentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = likeCommentSchema.parse({ commentId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const existingLike = await prisma.like.findFirst({
      where: {
        commentId: validatedData.commentId,
        userId: user.id,
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          commentId: validatedData.commentId,
        },
      })
    }

    // Get updated comment for count
    const updatedComment = await prisma.comment.findUnique({
      where: { id: validatedData.commentId },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    })

    return { 
      success: true, 
      data: { 
        likes: updatedComment?._count.likes || 0,
        isLiked: !existingLike 
      } 
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to like comment' 
    }
  }
}