import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// In produzione su GitHub Pages l'app vive in /<nome-repo>/ (vedi .github/workflows/deploy.yml)
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon.svg'],
      manifest: {
        name: 'Germoglio',
        short_name: 'Germoglio',
        description: 'Planner dei pasti e lista della spesa',
        lang: 'it',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Il lettore PDF (1,4 MB) serve solo a chi carica un piano: non si scarica all'installazione, ma si tiene in cache dopo il primo uso
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        globIgnores: ['**/pdf.worker*', '**/pdf.min*'],
        runtimeCaching: [{ urlPattern: /pdf\.(worker\.)?min.*\.m?js$/, handler: 'CacheFirst', options: { cacheName: 'pdf-reader', expiration: { maxEntries: 4 } } }],
      },
    }),
  ],
  build: {
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase') ? 'firebase' : undefined) } },
  },
});
