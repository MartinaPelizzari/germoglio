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
      workbox: { navigateFallback: 'index.html', globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
});
