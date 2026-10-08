import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Geliştirmede /api istekleri yerel backend'e yönlendirilir; Docker'da bu işi nginx yapar.
    // Böylece frontend kodu her iki ortamda da aynı göreli adresi (/api) kullanır.
    proxy: { '/api': 'http://localhost:3000' },
  },
});
