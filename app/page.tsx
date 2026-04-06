import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('common')
  
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-4">
        Blogsyra
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Welcome to your multi-language blog platform
      </p>
    </div>
  )
}