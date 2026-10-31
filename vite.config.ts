import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { redact } from '@tanstack/redact/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import { defineConfig } from 'vite'

const isProd = process.env.NODE_ENV === 'production'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    strictPort: true,
    warmup: {
      // Transform critical graphs at boot so the first hard reload is not a ~5s cold SSR.
      clientFiles: [
        './src/router.tsx',
        './src/routes/__root.tsx',
        './src/routes/index.tsx',
        './src/components/marketing/landing-page.tsx',
        './src/components/clerk-provider.tsx',
      ],
      ssrFiles: [
        './src/start.ts',
        './src/router.tsx',
        './src/routes/__root.tsx',
        './src/routes/index.tsx',
        './src/server/session.ts',
        './src/server/rsc/public-pages.tsx',
        './src/components/marketing/landing-page.tsx',
      ],
    },
  },
  // Redact needs server deps bundled so their `react` imports resolve to the
  // same runtime. `pg` stays external (Node driver).
  // https://tanstack.com/redact/latest/docs/start
  ssr: {
    // Bundle app + most deps for Redact; keep Postgres driver / ORM as Node requires
    // so Drizzle symbols stay single-instance.
    noExternal: true,
    external: [
      'pg',
      'pg-native',
      'drizzle-orm',
      'drizzle-orm/node-postgres',
      'drizzle-orm/pg-core',
    ],
  },
  optimizeDeps: {
    // pg: Node driver. radix-ui: "use client" tree — prebundling it
    // triggers RSC "inconsistently optimized" spam for every @radix-ui/* package.
    exclude: ['pg', 'pg-native', 'radix-ui', '@tanstack/redact'],
    // Prebundle stable client libs. Avoid @tanstack/react-router here — RSC
    // "use client" + optimizeDeps.include fights and can crash the Vite server.
    include: [
      '@clerk/tanstack-react-start',
      'motion',
      'motion/react',
      'next-themes',
      'nuqs',
      'sonner',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'date-fns',
      'zod',
    ],
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    minify: isProd ? 'esbuild' : false,
  },
  plugins: [
    // Devtools Vite plugin is heavy; in-app panels still load via import.meta.env.DEV.
    // devtools(),
    tailwindcss(),
    tanstackStart({
      rsc: { enabled: true },
      // Public auth pages can be warm-started; private app stays SSR via loaders.
      prerender: {
        enabled: false,
      },
    }),
    rsc(),
    viteReact(),
    // After Start + React. RSC env stays on upstream React; client/SSR use Redact.
    redact({
      features: {
        // Unused in this app; keep portal/suspense/context for Radix + Start.
        activity: false,
        fragmentRefs: false,
      },
    }),
  ],
})

export default config
