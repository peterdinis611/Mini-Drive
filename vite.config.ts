import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
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
  // Native addons must load via Node, not Vite's SSR module runner
  // (bindings breaks under eval: "Cannot read properties of undefined (reading 'indexOf')").
  ssr: {
    external: ['better-sqlite3'],
  },
  optimizeDeps: {
    exclude: ['better-sqlite3'],
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    minify: isProd ? 'esbuild' : false,
  },
  plugins: [
    devtools(),
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
  ],
})

export default config
