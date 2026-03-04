import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Virtual Module Plugin for Config Loading
function kompoConfigLoader() {
  const virtualModuleId = 'virtual:kompo-config'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'kompo-config-loader',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const configPath = path.resolve(__dirname, '../../libs/config/kompo.config.json')
        if (fs.existsSync(configPath)) {
          const config = fs.readFileSync(configPath, 'utf-8')
          return `export default ${config}`
        }
        return `export default {}`
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), kompoConfigLoader()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Library build for the client injector — self-contained, no external deps
  // Bundles React, ReactDOM, lucide-react etc. so it works in ANY framework (Vue, Nuxt, plain HTML)
  ...(mode === 'lib' && {
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/client/injector.ts'),
        name: 'KompoStudio',
        formats: ['iife'],
        fileName: () => 'kompo-studio.iife.js',
      },
      outDir: 'dist/client',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
  }),
}))
