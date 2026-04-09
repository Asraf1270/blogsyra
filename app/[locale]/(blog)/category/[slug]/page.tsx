import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPostsByCategory } from '@/lib/actions/post-actions'
import { PostCard } from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/PostCardSkeleton'
import { Suspense } from 'react'

interface CategoryPageProps {
  params: Promise<{
    locale: string
    slug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPostsByCategory({ slug, limit: 1 })
  
  if (!result.success || !result.data?.category) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found.',
    }
  }
  
  const { category } = result.data
  
  return {
    title: `${category.name} | Blogsyra`,
    description: category.description || `Explore all posts in the ${category.name} category on Blogsyra`,
    openGraph: {
      title: `${category.name} | Blogsyra`,
      description: category.description || `Explore all posts in the ${category.name} category`,
      type: 'website',
    },
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page = '1' } = await searchParams
  const currentPage = parseInt(page, 10)
  
  const result = await getPostsByCategory({ slug, page: currentPage, limit: 12 })
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const { category, posts, pagination } = result.data
  
  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Category Header */}
      <div className="text-center mb-12">
        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          Category
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {category.description}
          </p>
        )}
        <p className="text-muted-foreground mt-4">
          {pagination.total} post{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Posts Grid */}
      <Suspense fallback={<PostCardSkeleton count={12} />}>
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <a
                      key={pageNum}
                      href={`/category/${slug}?page=${pageNum}`}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pageNum === currentPage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {pageNum}
                    </a>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No posts found in this category yet.
            </p>
          </div>
        )}
      </Suspense>
    </div>
  )
}