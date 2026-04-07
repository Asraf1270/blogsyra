import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tags = await prisma.tag.findMany()
  return NextResponse.json(tags)
}