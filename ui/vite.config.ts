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
          const norm = id.replace(/\\/g, '/');
          if (norm.includes('node_modules')) {
            if (norm.includes('/react/') || norm.includes('/react-dom/') || norm.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (norm.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            return 'vendor-misc';
          }
          if (norm.includes('/ui/src/panels/ChatsPanel')) {
            return 'panel-chats';
          }
          if (norm.includes('/ui/src/panels/ContactsPanel') || norm.includes('/ui/src/panels/CrmPanel')) {
            return 'panel-crm';
          }
          if (norm.includes('/ui/src/i18n')) {
            return 'app-i18n';
          }
        }
      }
    }
  }
});
