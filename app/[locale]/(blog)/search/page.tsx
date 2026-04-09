'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchPosts } from '@/lib/actions/post-actions'
import { PostCard } from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/PostCardSkeleton'
import { Search as SearchIcon, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/i18n-navigation'
import { useDebounce } from '@/hooks/useDebounce'

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
      // Update URL
      router.replace(`/search?q=${encodeURIComponent(debouncedQuery)}`, { scroll: false })
    } else if (debouncedQuery === '') {
      setResults([])
      setTotal(0)
    }
  }, [debouncedQuery])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    const result = await searchPosts({ query: searchQuery, limit: 20 })
    if (result.success && result.data) {
      setResults(result.data.posts)
      setTotal(result.data.pagination.total)
    }
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query) {
      performSearch(query)
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setTotal(0)
    router.push('/search')
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Search Stories</h1>
        <p className="text-muted-foreground">
          Discover articles, stories, and ideas from our community
        </p>
      </div>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or content..."
          className="pl-10 pr-20 h-12"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-20 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2"
        >
          Search
        </Button>
      </form>
      
      {/* Results */}
      {loading ? (
        <PostCardSkeleton count={6} />
      ) : query && results.length > 0 ? (
        <>
          <div className="mb-6">
            <p className="text-muted-foreground">
              Found {total} result{total !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      ) : query && results.length === 0 ? (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            We couldn't find any posts matching "{query}"
          </p>
          <Button variant="outline" onClick={clearSearch} className="mt-4">
            Clear search
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Start searching</h2>
          <p className="text-muted-foreground">
            Enter keywords to find interesting stories
          </p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<PostCardSkeleton count={6} />}>
      <SearchContent />
    </Suspense>
  )
}