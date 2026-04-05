import { defineConfig, loadEnv } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    publicDir: 'public',
    // Exclude server-only packages from browser bundle
    optimizeDeps: {
      exclude: ['firebase-admin', '@prisma/client', 'express', 'cors'],
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss(tailwindConfig),
          autoprefixer,
        ],
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            firebase: ['firebase/app', 'firebase/auth'],
            i18n: ['i18next', 'i18next-http-backend'],
          },
        },
      },
    },
  };
});
