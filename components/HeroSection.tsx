'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, PenSquare } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 md:py-28">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          Write. Share.
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {' '}Inspire.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A modern platform for writers and thinkers. Share your stories, 
          connect with readers, and be part of a growing community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/editor/new">
              Start Writing
              <PenSquare className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/blog">
              Explore Stories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}