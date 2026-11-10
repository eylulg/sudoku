import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { themeInitScript } from '@eylulg/ui/theme-script';

// https://vite.dev/config/
export default defineConfig({
  // Served from https://eylulg.github.io/sudoku/ on GitHub Pages.
  base: '/sudoku/',
  plugins: [
    vue(),
    vueJsx(),
    {
      name: 'theme-init',
      transformIndexHtml: () => [
        { tag: 'script', children: themeInitScript, injectTo: 'head-prepend' },
      ],
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
