'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, UserButton } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useLocale } from 'next-intl'

export default function Navigation() {
  const { isSignedIn, userId } = useAuth()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navbar')
  
  const isAdmin = pathname?.includes('/admin')
  
  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="text-xl font-bold">
            Blogsyra
          </Link>
          
          <div className="hidden md:flex md:gap-4">
            <Link href={`/${locale}/blog`} className="text-sm hover:text-primary">
              {t('blog')}
            </Link>
            {isSignedIn && (
              <Link href={`/${locale}/dashboard`} className="text-sm hover:text-primary">
                {t('dashboard')}
              </Link>
            )}
            {isSignedIn && isAdmin && (
              <Link href={`/${locale}/admin`} className="text-sm hover:text-primary">
                {t('admin')}
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          
          {isSignedIn ? (
            <UserButton afterSignOutUrl={`/${locale}`} />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href={`/${locale}/sign-in`}>{t('signIn')}</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}