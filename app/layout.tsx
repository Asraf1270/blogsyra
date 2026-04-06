import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { UploadThingProvider } from '@/components/UploadThingProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Blogsyra - Modern Blog Platform',
  description: 'Write, share, and discover amazing stories',
  keywords: 'blog, writing, stories, publishing',
  authors: [{ name: 'Blogsyra' }],
  openGraph: {
    title: 'Blogsyra - Modern Blog Platform',
    description: 'Write, share, and discover amazing stories',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UploadThingProvider>
              {children}
              <Toaster />
            </UploadThingProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}