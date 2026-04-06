import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from '@/lib/uploadthing.server'

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
})