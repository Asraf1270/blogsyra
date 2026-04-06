'use client'

import { ReactNode } from 'react'

// Simple provider without any server imports
export function UploadThingProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}