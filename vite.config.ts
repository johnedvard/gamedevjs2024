import fs from 'fs';
import { defineConfig } from 'vite';
import path from 'path';

fs.rmSync('dist', { recursive: true, force: true }); // v14.14.0

export default defineConfig({
  base: './',
  plugins: [],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  build: {
    commonjsOptions: {
      include: [],
    },
  },

  optimizeDeps: {
    disabled: false,
  },
});
