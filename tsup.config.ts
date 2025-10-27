import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    'vite',
    'vue',
    '@vue/compiler-sfc',
    'markdown-it',
    'shiki',
    'typescript',
    'inquirer',
    'fs-extra',
    'chokidar',
    'fast-glob',
  ],
})

