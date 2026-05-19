import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://172.168.53.114:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'ws://172.168.53.114:3000',
        ws: true
      },
      '/uploads': {
        target: 'http://172.168.53.114:3000',
        changeOrigin: true
      }
    }
  }
})