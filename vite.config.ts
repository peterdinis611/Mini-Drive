import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isProd = process.env.NODE_ENV === 'production'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    strictPort: true,
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
      // Public auth pages can be warm-started; private app stays SSR via loaders.
      prerender: {
        enabled: false,
      },
    }),
    viteReact(),
  ],
})

export default config
