import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Calendar, Eye, Heart, MessageCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PostCardProps {
  post: {
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
    author: {
      name: string
      avatarUrl: string | null
    }
    tags: Array<{
      tag: {
        name: string
        slug: string
      }
    }>
  }
  featured?: boolean
  className?: string
}

export function PostCard({ post, featured = false, className }: PostCardProps) {
  const readingTime = () => {
    const text = post.excerpt || post.title
    const words = text.split(/\s+/).length
    const minutes = Math.ceil(words / 200)
    return minutes
  }

  return (
    <article
      className={cn(
        'group relative bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all duration-300',
        featured && 'md:flex md:gap-6 md:items-start',
        className
      )}
    >
      {/* Cover Image */}
      {post.coverImage && (
        <Link href={`/blog/${post.slug}`} className={cn(
          'block overflow-hidden',
          featured ? 'md:w-2/5' : 'w-full'
        )}>
          <div className={cn(
            'relative overflow-hidden',
            featured ? 'aspect-[4/3]' : 'aspect-[16/9]'
          )}>
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {featured && (
              <div className="absolute top-3 left-3">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Featured
                </Badge>
              </div>
            )}
          </div>
        </Link>
      )}
      
      {/* Content */}
      <div className={cn(
        'p-5 flex-1',
        featured && !post.coverImage && 'md:p-6'
      )}>
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
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
        
        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3 className={cn(
            'font-bold hover:text-primary transition-colors line-clamp-2',
            featured ? 'text-2xl mb-3' : 'text-xl mb-2'
          )}>
            {post.title}
          </h3>
        </Link>
        
        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}
        
        {/* Author & Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <Link
              href={`/profile/${post.author.name}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {post.author.name}
            </Link>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        
        {/* Reading Time */}
        <div className="mt-3 text-xs text-muted-foreground">
          {readingTime()} min read
        </div>
      </div>
    </article>
  )
}