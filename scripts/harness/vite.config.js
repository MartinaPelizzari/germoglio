// Ambiente di prova per la vista mobile: l'app vera con dati finti al posto di Firebase.
// Avvio: npx vite --config scripts/harness/vite.config.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

export default {
  root: here,
  plugins: [
    react(),
    {
      name: 'mock-data',
      enforce: 'pre',
      resolveId(id, importer) {
        if (id.endsWith('hooks/data.jsx') && importer && !importer.includes('harness')) return path.join(here, 'mock-data.jsx');
        if (id.endsWith('/firebase.js') && importer && !importer.includes('harness')) return path.join(here, 'mock-firebase.js');
        if (id === 'firebase/firestore' && importer && !importer.includes('harness')) return path.join(here, 'mock-firestore.js');
        return null;
      },
    },
  ],
  css: { postcss: root },
  server: { port: 5199, fs: { allow: [root] } },
  resolve: { dedupe: ['react', 'react-dom'] },
};
