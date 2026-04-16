import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { 'bin/kompo': 'src/bin/kompo.ts' },
  format: ['esm'],
  dts: false,
  clean: true,
  outDir: 'dist',
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [/^[^./]/],
})
