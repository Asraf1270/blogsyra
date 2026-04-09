import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { getUserProfile, getUserPosts } from '@/lib/actions/user-actions'
import { ProfileHeader } from '@/components/ProfileHeader'
import { ProfilePosts } from '@/components/ProfilePosts'
import { ProfileSidebar } from '@/components/ProfileSidebar'
import { generateProfileMetadata } from '@/lib/seo-utils'

interface ProfilePageProps {
  params: Promise<{
    locale: string
    clerkId: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { clerkId } = await params
  const result = await getUserProfile(clerkId)
  
  if (!result.success || !result.data) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    }
  }
  
  return generateProfileMetadata(result.data)
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { clerkId, locale } = await params
  
  // Get current authenticated user
  const { userId: currentClerkId } = await auth()
  const isOwner = currentClerkId === clerkId
  
  // Fetch profile data
  const profileResult = await getUserProfile(clerkId)
  
  if (!profileResult.success || !profileResult.data) {
    notFound()
  }
  
  const profile = profileResult.data
  
  // Fetch user's published posts
  const postsResult = await getUserPosts({
    clerkId,
    page: 1,
    limit: 12,
  })
  
  const posts = postsResult.success ? postsResult.data.posts : []
  const totalPosts = postsResult.success ? postsResult.data.pagination.total : 0
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Profile Header */}
        <ProfileHeader 
          profile={profile} 
          isOwner={isOwner}
          clerkId={clerkId}
        />
        
        {/* Profile Content */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar 
              profile={profile} 
              totalPosts={totalPosts}
              isOwner={isOwner}
            />
          </div>
          
          {/* Posts Grid */}
          <div className="lg:col-span-2">
            <ProfilePosts 
              posts={posts}
              totalPosts={totalPosts}
              isOwner={isOwner}
              clerkId={clerkId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}