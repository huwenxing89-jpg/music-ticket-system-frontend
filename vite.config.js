import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import qiankun from 'vite-plugin-qiankun'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  // 开发模式下 base 必须设置为具体的完整路径，或者设置 server.origin
  // 否则 qiankun 加载热更新资源时会去找主应用的 5170 端口，导致 404/fetch failed
  base: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/',
  plugins: [
    vue(),
    qiankun('music-ticket', {
      useDevMode: true
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
