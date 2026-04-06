import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from './uploadthing.server'

// This is safe to import in client components
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>()