import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Same single-origin convention as frontend/ (see docker/nginx.conf,
// vercel.json): the app calls /api/* and a proxy strips the prefix before
// forwarding to the real backend. Override the backend target with
// VITE_BACKEND_URL if it's not running on :8000 locally.
const BACKEND = process.env.VITE_BACKEND_URL ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174, // frontend/ already uses 5173 — keep both runnable side by side
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, "") },
    },
  },
});
