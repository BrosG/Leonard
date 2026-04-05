import { defineConfig, loadEnv } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    publicDir: 'public',
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
      sourcemap: true,
    },
  };
});
