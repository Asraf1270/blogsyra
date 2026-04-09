'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
})

export async function getUserProfile(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        _count: {
          select: {
            posts: {
              where: { status: 'PUBLISHED' },
            },
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, data: null, error: 'User not found' }
    }

    // Get recent posts count
    const postsCount = await prisma.post.count({
      where: {
        authorId: user.id,
        status: 'PUBLISHED',
      },
    })

    return {
      success: true,
      data: {
        ...user,
        postsCount,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch user profile',
    }
  }
}

export async function getUserPosts({
  clerkId,
  page = 1,
  limit = 12,
}: {
  clerkId: string
  page?: number
  limit?: number
}) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })

    if (!user) {
      return { success: false, data: null, error: 'User not found' }
    }

    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: user.id,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          views: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          authorId: user.id,
          status: 'PUBLISHED',
        },
      }),
    ])

    return {
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch user posts',
    }
  }
}

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validatedData = updateProfileSchema.parse(data)

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        avatarUrl: validatedData.avatarUrl,
      },
    })

    revalidatePath(`/profile/${userId}`)
    
    return {
      success: true,
      data: user,
      error: null,
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.errors[0].message,
      }
    }
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }
  }
}