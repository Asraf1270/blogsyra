import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: string
  clerkId: string
  email: string
  name: string
  role: UserRole
  bio: string | null
  avatarUrl: string | null
}

/**
 * Get the current authenticated user from Clerk and database
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })
    
    if (!user) return null
    
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth()
  return !!userId
}

/**
 * Check if the current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Get user role from database
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

/**
 * Middleware helper to check admin access
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}

/**
 * Middleware helper to check authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Sync Clerk user with database (to be called in webhook)
 */
export async function syncUser(clerkUser: any): Promise<AuthUser> {
  const email = clerkUser.emailAddresses[0]?.emailAddress
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || email?.split('@')[0]
  
  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: email,
      name: name,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: email,
      name: name,
      avatarUrl: clerkUser.imageUrl,
      role: 'USER', // Default role
    },
  })
  
  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
  }
}