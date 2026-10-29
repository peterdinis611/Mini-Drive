import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { redact } from '@tanstack/redact/vite'
import viteReact from '@vitejs/plugin-react'
import rsc from '@vitejs/plugin-rsc'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    strictPort: true,
  },
  // Redact needs server deps bundled so their `react` imports resolve to the
  // same runtime. better-sqlite3 stays external (native Node addon).
  // https://tanstack.com/redact/latest/docs/start
  ssr: {
    noExternal: true,
    external: ['better-sqlite3'],
  },
  optimizeDeps: {
    // better-sqlite3: native addon. radix-ui: "use client" tree — prebundling it
    // triggers RSC "inconsistently optimized" spam for every @radix-ui/* package.
    exclude: ['better-sqlite3', 'radix-ui', '@tanstack/redact'],
    include: ['@clerk/tanstack-react-start'],
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
