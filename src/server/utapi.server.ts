import { UTApi } from 'uploadthing/server'

import { logger } from '#/lib/logger'

const token = process.env.UPLOADTHING_TOKEN

if (!token) {
  logger.warn(
    '[mini-drive] UPLOADTHING_TOKEN chýba — upload a signed URL nebudú fungovať.',
  )
}

export const utapi = new UTApi({
  token,
  logFormat: 'json',
  logLevel: process.env.NODE_ENV === 'production' ? 'Error' : 'Info',
})
