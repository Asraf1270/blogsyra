import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from './uploadthing'

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>()