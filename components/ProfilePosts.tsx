'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Eye, Heart, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { getUserPosts } from '@/lib/actions/user-actions'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  views: number
  _count: {
    likes: number
    comments: number
  }
  tags: Array<{
    tag: {
      name: string
      slug: string
    }
  }>
}

interface ProfilePostsProps {
  posts: Post[]
  totalPosts: number
  isOwner: boolean
  clerkId: string
}

export function ProfilePosts({ posts: initialPosts, totalPosts, isOwner, clerkId }: ProfilePostsProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length < totalPosts)

  const loadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    const nextPage = page + 1
    const result = await getUserPosts({
      clerkId,
      page: nextPage,
      limit: 12,
    })
    
    if (result.success && result.data) {
      setPosts([...posts, ...result.data.posts])
      setPage(nextPage)
      setHasMore(result.data.posts.length === 12)
    }
    setLoading(false)
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground">
          {isOwner 
            ? "You haven't published any posts yet. Start writing your first post!"
            : "This user hasn't published any posts yet."}
        </p>
        {isOwner && (
          <Button asChild className="mt-4">
            <Link href="/editor/new">Create Your First Post</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Published Posts ({totalPosts})</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300"
          >
            {post.coverImage && (
              <Link href={`/blog/${post.slug}`}>
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
            )}
            
            <div className="p-5">
              <Link href={`/blog/${post.slug}`}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                  {post.title}
                </h3>
              </Link>
              
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}
              
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.slice(0, 3).map(({ tag }) => (
                    <Link
                      key={tag.slug}
                      href={`/tag/${tag.slug}`}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {post._count.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {post._count.comments}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}