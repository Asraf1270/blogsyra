import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const f = createUploadthing()

// Helper function to check authentication
const getAuth = async () => {
  const { userId } = await auth()
  if (!userId) throw new UploadThingError('Unauthorized')
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })
  
  if (!user) throw new UploadThingError('User not found')
  return { userId, user }
}

// Helper to check admin role
const getAdminAuth = async () => {
  const { userId, user } = await getAuth()
  if (user.role !== 'ADMIN') throw new UploadThingError('Admin access required')
  return { userId, user }
}

// FileRouter for your application
export const ourFileRouter = {
  // For post cover images
  coverImage: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId, user } = await getAuth()
      return { userId, userRole: user.role }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Cover image upload complete for user:', metadata.userId)
      
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
      }
    }),

  // For post content images (TipTap editor)
  postImage: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      const { userId } = await getAuth()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Post image upload complete for user:', metadata.userId)
      
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
        fileName: file.name,
        fileSize: file.size,
      }
    }),

  // For user avatars
  avatarImage: f({
    image: {
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await getAuth()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Avatar upload complete for user:', metadata.userId)
      
      // Update user's avatar URL in database
      await prisma.user.update({
        where: { clerkId: metadata.userId },
        data: { avatarUrl: file.url }
      })
      
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
      }
    }),

  // Admin-only: for system images
  adminImage: f({
    image: {
      maxFileSize: '10MB',
      maxFileCount: 10,
    },
  })
    .middleware(async () => {
      const { userId, user } = await getAdminAuth()
      return { userId, userRole: user.role }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Admin image upload complete by:', metadata.userId)
      
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.url,
        fileKey: file.key,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter