import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from '@/lib/i18n'

const intlMiddleware = createMiddleware(routing)

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/uploadthing(.*)',
])

// Protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/profile(.*)',
  '/editor(.*)',
  '/api/protected(.*)',
])

// Admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth()
  const userRole = (sessionClaims as any)?.metadata?.role || 'USER'
  const pathname = request.nextUrl.pathname

  // First, handle internationalization
  const response = intlMiddleware(request)
  
  // If intl middleware redirected, use that response
  let finalResponse = response
  
  // Then handle authentication
  if (isAdminRoute(request) && userRole !== 'ADMIN') {
    const locale = pathname.split('/')[1] || 'en'
    const url = new URL(`/${locale}/sign-in`, request.url)
    url.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(url)
  }

  if (isProtectedRoute(request) && !userId) {
    const locale = pathname.split('/')[1] || 'en'
    const signInUrl = new URL(`/${locale}/sign-in`, request.url)
    signInUrl.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (isPublicRoute(request)) {
    return finalResponse || NextResponse.next()
  }

  return finalResponse || NextResponse.next()
})

export const config = {
  matcher: [
    // Match all pathnames except static files
    '/((?!_next|.*\\..*|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}