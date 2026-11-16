import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the browser talks to nginx (http://localhost:8080), which proxies "/" to this dev server
// and "/api" to the backend. HMR_CLIENT_PORT tells the hot-reload client to connect back through nginx.
const hmrClientPort = process.env.HMR_CLIENT_PORT ? Number(process.env.HMR_CLIENT_PORT) : undefined

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Requests arrive through nginx with the public Host header.
    allowedHosts: true,
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
  },
})
