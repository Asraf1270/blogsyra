'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface DraftData {
  title: string
  slug: string
  excerpt?: string
  content?: any
  coverImage?: string | null
  categoryId?: string | null
  tagIds?: string[]
}

export async function savePostDraft(data: DraftData) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Find existing draft or create new one
    const existingDraft = await prisma.post.findFirst({
      where: {
        authorId: user.id,
        status: 'DRAFT',
        title: data.title,
      },
    })

    if (existingDraft) {
      // Update existing draft
      await prisma.post.update({
        where: { id: existingDraft.id },
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          categoryId: data.categoryId,
          updatedAt: new Date(),
        },
      })
    } else if (data.title && data.slug) {
      // Create new draft
      await prisma.post.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.coverImage,
          categoryId: data.categoryId,
          authorId: user.id,
          status: 'DRAFT',
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving draft:', error)
    return { success: false, error: 'Failed to save draft' }
  }
}

export async function publishPost(data: DraftData & { isPublished: boolean; publishedAt?: Date | null }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Create or update post
    const post = await prisma.post.upsert({
      where: {
        slug: data.slug,
      },
      update: {
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        categoryId: data.categoryId,
        status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: data.isPublished ? new Date() : null,
        updatedAt: new Date(),
      },
      create: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        categoryId: data.categoryId,
        authorId: user.id,
        status: data.isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: data.isPublished ? new Date() : null,
      },
    })

    // Handle tags
    if (data.tagIds && data.tagIds.length > 0) {
      await prisma.postTag.deleteMany({
        where: { postId: post.id },
      })

      await prisma.postTag.createMany({
        data: data.tagIds.map(tagId => ({
          postId: post.id,
          tagId,
        })),
      })
    }

    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)

    return { success: true, slug: post.slug }
  } catch (error) {
    console.error('Error publishing post:', error)
    return { success: false, error: 'Failed to publish post' }
  }
}