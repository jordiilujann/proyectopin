import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['colorthief'],
    esbuildOptions: {
      // Ensure CommonJS modules are handled properly
    },
  },
  resolve: {
    // Prefer ESM version if available
    conditions: ['import', 'module', 'browser', 'default'],
    // Explicitly resolve colorthief to its ESM build
    alias: {
      'colorthief': 'colorthief/dist/color-thief.mjs',
    },
  },
  build: {
    commonjsOptions: {
      include: [/colorthief/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
});

