import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev-only proxy so `npm run dev` talks to a locally running backend
// (uvicorn on :8000) the same single-origin way nginx does in every deploy
// target (docker/nginx.conf, deploy/nginx.conf.template) — no CORS handling
// needed anywhere in the app.
const BACKEND = "http://localhost:8000";

// Deliberately NOT a PWA: no manifest, no service worker, no "install app"
// browser prompt. This is a website, not an installable app.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // /api/* -> backend /*  (mirrors nginx's "trailing slash strips the
      // /api prefix" behavior in docker/nginx.conf and the Vercel function).
      "/api": { target: BACKEND, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, "") },
      "/health": { target: BACKEND, changeOrigin: true },
      "/docs": { target: BACKEND, changeOrigin: true },
      "/openapi.json": { target: BACKEND, changeOrigin: true },
    },
  },
});
