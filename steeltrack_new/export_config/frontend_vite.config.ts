import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 5178,
    host: '172.168.53.114',
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});
