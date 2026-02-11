import { defineConfig } from 'vite';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Include crypto polyfill
      include: ['crypto', 'stream', 'util', 'buffer'],
      // Exclude modules we don't need
      exclude: ['fs', 'path', 'os', 'net', 'tls'],
      // Whether to polyfill `node:` protocol imports
      protocolImports: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'polypure',
      fileName: 'index',
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
      },
    },
    target: 'esnext',
    minify: true,
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
});
