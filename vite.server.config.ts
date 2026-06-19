import { defineConfig } from 'vite';

// Server (serverless Node handler) build. Devvit runs this bundle for endpoints,
// scheduler tasks, menu actions and triggers.
export default defineConfig({
  build: {
    outDir: 'dist/server',
    emptyOutDir: true,
    ssr: true,
    target: 'node20',
    sourcemap: false,
    rollupOptions: {
      input: 'src/server/index.ts',
      output: { entryFileNames: 'index.js', format: 'es' },
      // Provided by the Devvit runtime; do not bundle.
      external: ['@devvit/web/server'],
    },
  },
});
