import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev proxies /api to `vercel dev` (run separately on :3000) so the
// frontend and serverless functions can be developed together.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
