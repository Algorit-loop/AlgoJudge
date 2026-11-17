import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the browser talks to nginx, which proxies "/" to this dev server and "/api" to the API.
// The hot-reload (HMR) WebSocket is deliberately left without a fixed port: the client then connects back
// to whatever host and port the page was opened from (http://localhost:8080, an HTTPS tunnel on 443, ...).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Requests arrive through nginx (or a tunnel) with the public Host header.
    allowedHosts: true,
  },
})
