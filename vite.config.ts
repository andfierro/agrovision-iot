import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // ✅ AGREGAR ESTO para GitHub Pages
      base: process.env.NODE_ENV === 'production' ? './' : '/',
	  server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
		},
      // ✅ Optimizar build para GitHub Pages
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
      }
    };
});
