import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/docs': 'http://127.0.0.1:3000',
      '/media': 'http://127.0.0.1:3000',
      '/ws': {
        target: 'ws://127.0.0.1:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Code-splitting: vendor libraries get their own long-term-cacheable chunks,
        // so app code changes no longer invalidate the whole bundle and the initial
        // parse cost drops (previously one 500+ kB monolithic JS chunk).
        manualChunks(id: string) {
          if (!id.includes('node_modules')) {
            return undefined;
          }
          // React core: needed immediately at boot
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react';
          }
          // Icon library ships thousands of icons; only the imported ones end up in
          // the chunk, but keeping them separate lets React + app code stay cacheable.
          if (id.includes('/lucide-react/')) {
            return 'vendor-icons';
          }
          // Everything else (tiny libs) — merged into one vendor chunk
          return 'vendor-misc';
        }
      }
    }
  }
});
