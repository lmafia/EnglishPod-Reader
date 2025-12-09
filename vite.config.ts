import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: path.resolve(__dirname, './src'), // 入口是 src
    publicDir: path.resolve(__dirname, './public'), // 指向 public
    build: {
      outDir: path.resolve(__dirname, './dist'), // dist 输出在项目根目录
      emptyOutDir: true,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {

    },
    base: './',
  };
});
