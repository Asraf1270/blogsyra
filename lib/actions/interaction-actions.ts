'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const toggleLikeSchema = z.object({
  postId: z.string().min(1),
})

const toggleBookmarkSchema = z.object({
  postId: z.string().min(1),
})

const checkLikeStatusSchema = z.object({
  postId: z.string().min(1),
})

const checkBookmarkStatusSchema = z.object({
  postId: z.string().min(1),
})

export async function toggleLike(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = toggleLikeSchema.parse({ postId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: validatedData.postId,
        },
      },
    })

    let isLiked = false
    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      isLiked = false
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: validatedData.postId,
        },
      })
      isLiked = true
    }

    // Get updated like count
    const post = await prisma.post.findUnique({
      where: { id: validatedData.postId },
      select: {
        _count: {
          select: { likes: true },
        },
      },
    })

    revalidatePath(`/blog/${validatedData.postId}`)
    
    return { 
      success: true, 
      data: { 
        isLiked, 
        likesCount: post?._count.likes || 0 
      } 
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle like' 
    }
  }
}

export async function toggleBookmark(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = toggleBookmarkSchema.parse({ postId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: validatedData.postId,
        },
      },
    })

    let isBookmarked = false
    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      })
      isBookmarked = false
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          postId: validatedData.postId,
        },
      })
      isBookmarked = true
    }

    revalidatePath(`/blog/${validatedData.postId}`)
    
    return { 
      success: true, 
      data: { isBookmarked } 
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to toggle bookmark' 
    }
  }
}

export async function checkLikeStatus(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: true, data: { isLiked: false, likesCount: 0 } }
    }

    const validatedData = checkLikeStatusSchema.parse({ postId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: true, data: { isLiked: false, likesCount: 0 } }
    }

    const [like, post] = await Promise.all([
      prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: user.id,
            postId: validatedData.postId,
          },
        },
      }),
      prisma.post.findUnique({
        where: { id: validatedData.postId },
        select: {
          _count: {
            select: { likes: true },
          },
        },
      }),
    ])

    return { 
      success: true, 
      data: { 
        isLiked: !!like,
        likesCount: post?._count.likes || 0
      } 
    }
  } catch (error) {
    console.error('Error checking like status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check like status' 
    }
  }
}

export async function checkBookmarkStatus(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: true, data: { isBookmarked: false } }
    }

    const validatedData = checkBookmarkStatusSchema.parse({ postId })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: true, data: { isBookmarked: false } }
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: validatedData.postId,
        },
      },
    })

    return { 
      success: true, 
      data: { isBookmarked: !!bookmark } 
    }
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check bookmark status' 
    }
  }
}