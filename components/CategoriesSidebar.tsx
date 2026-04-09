import Link from 'next/link'
import { getAllCategoriesWithCount } from '@/lib/actions/category-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function CategoriesSidebar() {
  const result = await getAllCategoriesWithCount()
  
  if (!result.success || !result.data) {
    return null
  }
  
  const categories = result.data
  
  if (categories.length === 0) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <span className="text-sm group-hover:text-primary transition-colors">
              {category.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {category._count.posts}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}