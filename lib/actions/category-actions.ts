'use server'

import { prisma } from '@/lib/prisma'

export async function getAllCategoriesWithCount() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return { success: true, data: categories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, data: null, error: 'Failed to fetch categories' }
  }
}