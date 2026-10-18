import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '#/db'
import * as schema from '#/db/schema'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      onboardedAt: {
        type: 'date',
        required: false,
        input: false,
      },
      viewPreference: {
        type: 'string',
        required: false,
        defaultValue: 'list',
        input: true,
      },
      onboardingStep: {
        type: 'number',
        required: false,
        defaultValue: 1,
        input: false,
      },
    },
  },
  plugins: [tanstackStartCookies()],
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = Session['user']
