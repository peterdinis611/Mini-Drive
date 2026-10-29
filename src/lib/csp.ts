/**
 * Content-Security-Policy tuned for TanStack Start + Vite + Clerk + UploadThing + Google Fonts.
 * Dev relaxes script/connect for HMR; production stays stricter.
 */
export function buildContentSecurityPolicy(
  env: 'development' | 'production' | 'test' = 'production',
): string {
  const isDev = env === 'development'

  const clerkHosts = [
    'https://*.clerk.accounts.dev',
    'https://*.clerk.com',
    'https://clerk.com',
    'https://api.clerk.com',
  ]

  const scriptSrc = [
    "'self'",
    ...clerkHosts,
    // React / Vite hydration & HMR need these in development.
    ...(isDev ? ["'unsafe-inline'", "'unsafe-eval'"] : ["'unsafe-inline'"]),
  ]

  const connectSrc = [
    "'self'",
    ...clerkHosts,
    'https://*.uploadthing.com',
    'https://uploadthing.com',
    'https://*.ufs.sh',
    'https://utfs.io',
    'https://api.pwnedpasswords.com',
    ...(isDev
      ? [
          'ws:',
          'wss:',
          'http://localhost:*',
          'http://127.0.0.1:*',
          'ws://localhost:*',
          'ws://127.0.0.1:*',
        ]
      : []),
  ]

  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'", ...clerkHosts, 'https://accounts.google.com']],
    ['frame-ancestors', ["'none'"]],
    ['object-src', ["'none'"]],
    ['script-src', scriptSrc],
    [
      'style-src',
      [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://api.fontshare.com',
        'https://cdn.fontshare.com',
      ],
    ],
    [
      'font-src',
      [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.fontshare.com',
        'data:',
      ],
    ],
    [
      'img-src',
      [
        "'self'",
        'data:',
        'blob:',
        'https://img.clerk.com',
        'https://*.clerk.com',
        'https://*.ufs.sh',
        'https://utfs.io',
        'https://*.uploadthing.com',
        'https://picsum.photos',
        'https://fastly.picsum.photos',
      ],
    ],
    [
      'media-src',
      [
        "'self'",
        'blob:',
        'https://*.ufs.sh',
        'https://utfs.io',
        'https://*.uploadthing.com',
      ],
    ],
    ['connect-src', connectSrc],
    ['worker-src', ["'self'", 'blob:']],
    [
      'frame-src',
      ["'self'", 'blob:', ...clerkHosts, 'https://challenges.cloudflare.com'],
    ],
    ['upgrade-insecure-requests', []],
  ]

  // upgrade-insecure-requests is noisy / wrong on plain http localhost
  const active = isDev
    ? directives.filter(([name]) => name !== 'upgrade-insecure-requests')
    : directives

  return active
    .map(([name, values]) =>
      values.length === 0 ? name : `${name} ${values.join(' ')}`,
    )
    .join('; ')
}
