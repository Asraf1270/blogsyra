import { Metadata } from 'next'

interface PostSEOData {
  title: string
  excerpt: string | null
  coverImage: string | null
  slug: string
  author: {
    name: string
  }
  publishedAt: Date | null
  updatedAt: Date
  tags: Array<{ tag: { name: string } }>
}

export function generatePostMetadata(post: PostSEOData): Metadata {
  const title = `${post.title} | Blogsyra`
  const description = post.excerpt || `Read "${post.title}" by ${post.author.name} on Blogsyra`
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`
  const imageUrl = post.coverImage || `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`
  
  return {
    title,
    description,
    keywords: post.tags.map(t => t.tag.name).join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title,
      description,
      url,
      siteName: 'Blogsyra',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author.name],
      tags: post.tags.map(t => t.tag.name),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@blogsyra',
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}