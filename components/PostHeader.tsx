'use client'

import { Calendar, Clock, Eye, MessageCircle, Share2 } from 'lucide-react'
import { format } from 'date-fns'

interface PostHeaderProps {
  post: {
    title: string
    excerpt: string | null
    publishedAt: Date | null
    updatedAt: Date
    views: number
    _count: {
      comments: number
    }
    author: {
      name: string
      avatarUrl: string | null
    }
    category?: {
      name: string
      slug: string
    } | null
  }
}

export function PostHeader({ post }: PostHeaderProps) {
  const readingTime = (content: any) => {
    // Rough estimate: ~200 words per minute
    const text = JSON.stringify(content || '')
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return minutes
  }

  return (
    <div className="relative py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category */}
        {post.category && (
          <a
            href={`/category/${post.category.slug}`}
            className="inline-block mb-4 text-sm font-medium text-primary hover:underline"
          >
            {post.category.name}
          </a>
        )}
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
          {post.title}
        </h1>
        
        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
            {post.excerpt}
          </p>
        )}
        
        {/* Author & Metadata */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img
              src={post.author.avatarUrl || '/default-avatar.png'}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-medium text-foreground">
                {post.author.name}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readingTime(post.content)} min read
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post._count.comments} comments
            </span>
            <button
              onClick={() => {
                navigator.share?.({
                  title: post.title,
                  text: post.excerpt || undefined,
                  url: window.location.href,
                })
              }}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}