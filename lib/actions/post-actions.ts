'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { PostStatus } from '@prisma/client'

// ==================== Validation Schemas ====================

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200) // Max slug length
}

const postBaseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform((str) => str.trim()),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
    .optional(),
  content: z.any().nullable().optional(),
  excerpt: z.string()
    .max(500, 'Excerpt must be less than 500 characters')
    .optional()
    .transform((str) => str?.trim() || null),
  coverImage: z.string().url('Invalid image URL').nullable().optional(),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.date().nullable().optional(),
})

const createPostSchema = postBaseSchema.extend({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
})

const updatePostSchema = postBaseSchema.extend({
  id: z.string().min(1, 'Post ID is required'),
})

const deletePostSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
})

const publishPostSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
})

const incrementViewCountSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
})

// ==================== Helper Functions ====================

async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

async function verifyPostOwnership(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })

  if (!post) {
    throw new Error('Post not found')
  }

  if (post.authorId !== userId) {
    throw new Error('You do not have permission to modify this post')
  }

  return post
}

// ==================== Server Actions ====================

/**
 * Create a new post
 */
export async function createPost(data: z.infer<typeof createPostSchema>) {
  try {
    // Validate input
    const validatedData = createPostSchema.parse(data)
    
    // Get current user
    const user = await getCurrentUser()
    
    // Generate slug if not provided
    let slug = validatedData.slug
    if (!slug) {
      slug = generateSlug(validatedData.title)
    }
    
    // Check if slug is unique
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    })
    
    if (existingPost) {
      // Append timestamp to make slug unique
      slug = `${slug}-${Date.now()}`
    }
    
    // Create post
    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        slug,
        content: validatedData.content || null,
        excerpt: validatedData.excerpt,
        coverImage: validatedData.coverImage,
        status: validatedData.status,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        authorId: user.id,
        categoryId: validatedData.categoryId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    
    // Handle tags
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      await prisma.postTag.createMany({
        data: validatedData.tagIds.map(tagId => ({
          postId: post.id,
          tagId,
        })),
      })
    }
    
    // Revalidate paths
    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/dashboard/posts')
    
    return {
      success: true,
      data: post,
      error: null,
    }
  } catch (error) {
    console.error('Error creating post:', error)
    
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
      error: error instanceof Error ? error.message : 'Failed to create post',
    }
  }
}

/**
 * Update an existing post
 */
export async function updatePost(data: z.infer<typeof updatePostSchema>) {
  try {
    // Validate input
    const validatedData = updatePostSchema.parse(data)
    
    // Get current user
    const user = await getCurrentUser()
    
    // Verify ownership
    await verifyPostOwnership(validatedData.id, user.id)
    
    // Handle slug uniqueness if title changed
    let slug = validatedData.slug
    if (validatedData.title && !validatedData.slug) {
      slug = generateSlug(validatedData.title)
      
      const existingPost = await prisma.post.findFirst({
        where: {
          slug,
          NOT: { id: validatedData.id },
        },
      })
      
      if (existingPost) {
        slug = `${slug}-${Date.now()}`
      }
    }
    
    // Update post
    const post = await prisma.post.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        slug: slug || undefined,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        coverImage: validatedData.coverImage,
        categoryId: validatedData.categoryId,
        status: validatedData.status,
        publishedAt: validatedData.status === 'PUBLISHED' && !validatedData.publishedAt 
          ? new Date() 
          : validatedData.publishedAt,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    
    // Update tags
    if (validatedData.tagIds) {
      // Remove existing tags
      await prisma.postTag.deleteMany({
        where: { postId: post.id },
      })
      
      // Add new tags
      if (validatedData.tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: validatedData.tagIds.map(tagId => ({
            postId: post.id,
            tagId,
          })),
        })
      }
    }
    
    // Revalidate paths
    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/dashboard/posts')
    
    return {
      success: true,
      data: post,
      error: null,
    }
  } catch (error) {
    console.error('Error updating post:', error)
    
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
      error: error instanceof Error ? error.message : 'Failed to update post',
    }
  }
}

/**
 * Delete a post
 */
export async function deletePost(data: z.infer<typeof deletePostSchema>) {
  try {
    // Validate input
    const validatedData = deletePostSchema.parse(data)
    
    // Get current user
    const user = await getCurrentUser()
    
    // Verify ownership
    await verifyPostOwnership(validatedData.id, user.id)
    
    // Get post slug before deletion for revalidation
    const post = await prisma.post.findUnique({
      where: { id: validatedData.id },
      select: { slug: true },
    })
    
    // Delete post
    await prisma.post.delete({
      where: { id: validatedData.id },
    })
    
    // Revalidate paths
    revalidatePath('/blog')
    if (post?.slug) {
      revalidatePath(`/blog/${post.slug}`)
    }
    revalidatePath('/dashboard/posts')
    
    return {
      success: true,
      data: { id: validatedData.id, deleted: true },
      error: null,
    }
  } catch (error) {
    console.error('Error deleting post:', error)
    
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
      error: error instanceof Error ? error.message : 'Failed to delete post',
    }
  }
}

/**
 * Publish a draft post
 */
export async function publishPost(data: z.infer<typeof publishPostSchema>) {
  try {
    // Validate input
    const validatedData = publishPostSchema.parse(data)
    
    // Get current user
    const user = await getCurrentUser()
    
    // Verify ownership
    await verifyPostOwnership(validatedData.id, user.id)
    
    // Update post status
    const post = await prisma.post.update({
      where: { id: validatedData.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })
    
    // Revalidate paths
    revalidatePath('/blog')
    revalidatePath(`/blog/${post.slug}`)
    revalidatePath('/dashboard/posts')
    
    return {
      success: true,
      data: post,
      error: null,
    }
  } catch (error) {
    console.error('Error publishing post:', error)
    
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
      error: error instanceof Error ? error.message : 'Failed to publish post',
    }
  }
}

/**
 * Increment view count for a post
 */
export async function incrementViewCount(data: z.infer<typeof incrementViewCountSchema>) {
  try {
    // Validate input
    const validatedData = incrementViewCountSchema.parse(data)
    
    // Increment view count
    const post = await prisma.post.update({
      where: { id: validatedData.id },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        views: true,
      },
    })
    
    return {
      success: true,
      data: { id: post.id, views: post.views },
      error: null,
    }
  } catch (error) {
    console.error('Error incrementing view count:', error)
    
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
      error: error instanceof Error ? error.message : 'Failed to increment view count',
    }
  }
}

/**
 * Generate slug from title (utility function)
 */
export async function generateSlugFromTitle(title: string): Promise<string> {
  try {
    const slug = generateSlug(title)
    
    // Check if slug exists
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    })
    
    if (existingPost) {
      // Make slug unique by appending timestamp
      return `${slug}-${Date.now()}`
    }
    
    return slug
  } catch (error) {
    console.error('Error generating slug:', error)
    throw new Error('Failed to generate slug')
  }
}

/**
 * Get post by slug with optional authentication for draft access
 */
export async function getPostBySlug(slug: string) {
  try {
    const { userId } = await auth()
    
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          where: {
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
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
    
    if (!post) {
      return {
        success: false,
        data: null,
        error: 'Post not found',
      }
    }
    
    // Check if user has access to draft
    if (post.status === 'DRAFT') {
      if (!userId) {
        return {
          success: false,
          data: null,
          error: 'Post not found',
        }
      }
      
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      })
      
      if (!user || (post.authorId !== user.id && user.role !== 'ADMIN')) {
        return {
          success: false,
          data: null,
          error: 'Post not found',
        }
      }
    }
    
    return {
      success: true,
      data: post,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch post',
    }
  }
}

/**
 * Get posts with filtering and pagination
 */
export async function getPosts({
  page = 1,
  limit = 10,
  status = 'PUBLISHED',
  categoryId,
  tagId,
  search,
  authorId,
}: {
  page?: number
  limit?: number
  status?: PostStatus
  categoryId?: string
  tagId?: string
  search?: string
  authorId?: string
}) {
  try {
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (authorId) {
      where.authorId = authorId
    }
    
    // Get posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
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
    console.error('Error fetching posts:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch posts',
    }
  }
}

export async function getRelatedPosts({
  postId,
  categoryId,
  tagIds,
  limit = 3,
}: {
  postId: string
  categoryId?: string | null
  tagIds: string[]
  limit?: number
}) {
  try {
    // Get posts from same category or with similar tags
    const related = await prisma.post.findMany({
      where: {
        id: { not: postId },
        status: 'PUBLISHED',
        OR: [
          { categoryId: categoryId || undefined },
          {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        views: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    })

    return { success: true, data: related }
  } catch (error) {
    console.error('Error fetching related posts:', error)
    return { success: false, data: [], error: 'Failed to fetch related posts' }
  }
}