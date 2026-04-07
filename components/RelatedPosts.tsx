'use client'

import Link from 'next/link'
import { Calendar, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  publishedAt: Date | null
  views: number
}

interface RelatedPostsProps {
  posts: RelatedPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="group block"
        >
          <article className="h-full bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300">
            {post.coverImage && (
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              
              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.views.toLocaleString()} views
                </span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  )
}