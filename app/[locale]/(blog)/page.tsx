import { Suspense } from 'react'
import { getLatestPosts, getTrendingPosts } from '@/lib/actions/post-actions'
import { PostCard } from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/PostCardSkeleton'
import { HeroSection } from '@/components/HeroSection'
import { CategoriesSidebar } from '@/components/CategoriesSidebar'

export const revalidate = 60 // Revalidate every 60 seconds

export default async function HomePage() {
  // Fetch both latest and trending posts in parallel for better performance
  const [latestPostsResult, trendingPostsResult] = await Promise.all([
    getLatestPosts({ limit: 6 }),
    getTrendingPosts({ limit: 6, daysBack: 7 }),
  ])

  const latestPosts = latestPostsResult.success ? latestPostsResult.data : []
  const trendingPosts = trendingPostsResult.success ? trendingPostsResult.data : []

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Trending Section */}
            {trendingPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Trending 🔥</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                      Most popular posts this week
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {trendingPosts.map((post, index) => (
                    <PostCard key={post.id} post={post} featured={index < 3} />
                  ))}
                </div>
              </section>
            )}
            
            {/* Latest Posts Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Latest Stories</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Fresh content from our community
                  </p>
                </div>
              </div>
              
              <Suspense fallback={<PostCardSkeleton count={6} />}>
                {latestPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {latestPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No posts yet.</p>
                  </div>
                )}
              </Suspense>
            </section>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg" />}>
              <CategoriesSidebar />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}