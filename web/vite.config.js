import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'flutter-web-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0];
          
          // 1. 末尾スラッシュなしの /svc/mobile へのアクセスの場合
          // 相対パスのズレ（404エラーやSyntax error）を防ぐため、ブラウザに /svc/mobile/ (スラッシュあり) へリダイレクトするよう応答します
          if (url === '/svc/mobile') {
            res.writeHead(301, { Location: '/svc/mobile/' });
            res.end();
            return;
          }
          
          // 2. 末尾スラッシュありの /svc/mobile/ へのアクセスの場合
          // 内部的に index.html への要求に書き換え、ViteのSPAフォールバック（Reactへの遷移）を防ぎます
          if (url === '/svc/mobile/') {
            req.url = '/svc/mobile/index.html';
          }
          next();
        });
      }
    }
  ],
  envDir: '../',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
})
