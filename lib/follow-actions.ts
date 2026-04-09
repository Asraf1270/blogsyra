'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function followUser(targetClerkId: string) {
  try {
    const { userId: currentClerkId } = await auth()
    if (!currentClerkId) throw new Error('Unauthorized')
    if (currentClerkId === targetClerkId) throw new Error('Cannot follow yourself')

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentClerkId },
    })
    
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetClerkId },
    })

    if (!currentUser || !targetUser) throw new Error('User not found')

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    })

    if (existingFollow) {
      throw new Error('Already following this user')
    }

    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUser.id,
      },
    })

    revalidatePath(`/profile/${targetClerkId}`)
    
    return { success: true, data: { isFollowing: true } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to follow user',
    }
  }
}

export async function unfollowUser(targetClerkId: string) {
  try {
    const { userId: currentClerkId } = await auth()
    if (!currentClerkId) throw new Error('Unauthorized')

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentClerkId },
    })
    
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetClerkId },
    })

    if (!currentUser || !targetUser) throw new Error('User not found')

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: targetUser.id,
      },
    })

    revalidatePath(`/profile/${targetClerkId}`)
    
    return { success: true, data: { isFollowing: false } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unfollow user',
    }
  }
}

export async function checkFollowStatus(targetClerkId: string) {
  try {
    const { userId: currentClerkId } = await auth()
    if (!currentClerkId) {
      return { success: true, data: { isFollowing: false } }
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: currentClerkId },
    })
    
    const targetUser = await prisma.user.findUnique({
      where: { clerkId: targetClerkId },
    })

    if (!currentUser || !targetUser) {
      return { success: true, data: { isFollowing: false } }
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    })

    return { success: true, data: { isFollowing: !!follow } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check follow status',
    }
  }
}