'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function toggleLike(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) throw new Error('User not found')

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      return { success: true, data: { isLiked: false } }
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId,
        },
      })
      return { success: true, data: { isLiked: true } }
    }
  } catch (error) {
    return { success: false, error: 'Failed to toggle like' }
  }
}

export async function toggleBookmark(postId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) throw new Error('User not found')

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId,
        },
      },
    })

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      })
      return { success: true, data: { isBookmarked: false } }
    } else {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          postId,
        },
      })
      return { success: true, data: { isBookmarked: true } }
    }
  } catch (error) {
    return { success: false, error: 'Failed to toggle bookmark' }
  }
}