import { defineConfig } from 'vite';

// Client (webview) build. Produces the static bundle Devvit serves inside the post.
export default defineConfig({
  root: 'src/client',
  publicDir: 'public',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // three.js is large; keep it in its own chunk so the shell paints first.
        manualChunks: { three: ['three'] },
      },
    },
  },
});
