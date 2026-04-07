'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getComments(postId: string) {
  try {
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
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
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

    return { success: true, data: comments }
  } catch (error) {
    return { success: false, error: 'Failed to load comments' }
  }
}

export async function createComment(data: {
  postId: string
  content: string
  parentId?: string | null
}) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) throw new Error('User not found')

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: user.id,
        postId: data.postId,
        parentId: data.parentId,
      },
    })

    revalidatePath(`/blog/${data.postId}`)
    return { success: true, data: comment }
  } catch (error) {
    return { success: false, error: 'Failed to create comment' }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) throw new Error('User not found')

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment || comment.authorId !== user.id) {
      throw new Error('Unauthorized')
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete comment' }
  }
}

export async function likeComment(commentId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) throw new Error('User not found')

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    })

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } })
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          commentId,
        },
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to like comment' }
  }
}