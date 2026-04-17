import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'client.ts', 'server.ts', 'loader.ts', 'constants.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
})
