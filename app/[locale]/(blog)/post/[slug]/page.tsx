import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPostBySlug, getRelatedPosts, incrementViewCount } from '@/lib/actions/post-actions'
import { PostView } from '@/components/PostView'
import { PostHeader } from '@/components/PostHeader'
import { PostActions } from '@/components/PostActions'
import { CommentsSection } from '@/components/CommentsSection'
import { RelatedPosts } from '@/components/RelatedPosts'
import { generatePostMetadata } from '@/lib/seo-utils'

interface PostPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPostBySlug(slug)
  
  if (!result.success || !result.data) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    }
  }
  
  return generatePostMetadata(result.data)
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug, locale } = await params
  
  // Fetch post data
  const result = await getPostBySlug(slug)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const post = result.data
  
  // Increment view count asynchronously (don't await)
  incrementViewCount({ id: post.id }).catch(console.error)
  
  // Fetch related posts
  const relatedResult = await getRelatedPosts({
    postId: post.id,
    categoryId: post.categoryId,
    tagIds: post.tags.map(t => t.tag.id),
    limit: 3,
  })
  
  const relatedPosts = relatedResult.success ? relatedResult.data : []
  
  // Format date for schema markup
  const publishedDate = post.publishedAt?.toISOString()
  const updatedDate = post.updatedAt?.toISOString()
  
  return (
    <>
      {/* Article Schema Markup for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            datePublished: publishedDate,
            dateModified: updatedDate,
            author: {
              '@type': 'Person',
              name: post.author.name,
              url: `/author/${post.author.id}`,
            },
            publisher: {
              '@type': 'Organization',
              name: 'Blogsyra',
              logo: {
                '@type': 'ImageObject',
                url: '/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `/blog/${post.slug}`,
            },
            keywords: post.tags.map(t => t.tag.name).join(', '),
          }),
        }}
      />
      
      <article className="min-h-screen bg-background">
        {/* Header Section */}
        <PostHeader post={post} />
        
        {/* Main Content */}
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="mb-12 -mt-8">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl shadow-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="object-cover w-full h-full"
                  loading="eager"
                  priority
                />
              </div>
            </div>
          )}
          
          {/* Post Actions Bar (Sticky) */}
          <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b mb-8">
            <PostActions
              postId={post.id}
              initialLikes={post._count.likes}
              initialBookmarks={0}
              slug={post.slug}
            />
          </div>
          
          {/* Content */}
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mx-auto">
            <PostView content={post.content} />
          </div>
          
          {/* Tags Section */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(({ tag }) => (
                  <a
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-muted hover:bg-muted/80 transition-colors"
                  >
                    #{tag.name}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Author Bio */}
          <div className="mt-12 p-6 bg-muted/30 rounded-2xl border">
            <div className="flex items-start gap-4">
              <img
                src={post.author.avatarUrl || '/default-avatar.png'}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{post.author.name}</h3>
                {post.author.bio && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {post.author.bio}
                  </p>
                )}
                <a
                  href={`/author/${post.author.id}`}
                  className="inline-block mt-3 text-sm text-primary hover:underline"
                >
                  View all posts by {post.author.name}
                </a>
              </div>
            </div>
          </div>
          
          {/* Comments Section */}
          <div className="mt-12">
            <CommentsSection postId={post.id} />
          </div>
        </div>
        
        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="bg-muted/20 py-16 mt-16">
            <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-8">
                You Might Also Like
              </h2>
              <RelatedPosts posts={relatedPosts} />
            </div>
          </div>
        )}
      </article>
    </>
  )
}