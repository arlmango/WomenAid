import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Dev-only proxy so `npm run dev` talks to a locally running backend
// (uvicorn on :8000) the same single-origin way nginx does in every deploy
// target (docker/nginx.conf, deploy/nginx.conf.template) — no CORS handling
// needed anywhere in the app.
const BACKEND = "http://localhost:8000";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "generateSW",
      // Manifest/scope is patient-only by design: the clinic dashboard is a
      // normal desktop web page, not an installable app (see plan).
      manifest: {
        id: "/patient",
        name: "WomenAId — кабинет пациентки",
        short_name: "WomenAId",
        description:
          "Личный кабинет пациентки: вход, согласие и информация о скрининге. Демо. Не является постановкой диагноза.",
        lang: "ru",
        dir: "ltr",
        start_url: "/patient",
        scope: "/patient/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#FDF6F9",
        theme_color: "#E8779A",
        categories: ["health", "medical"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache ONLY the built app shell (JS/CSS/HTML/icons). No
        // runtimeCaching entries are added for /api, /health, /docs,
        // /openapi.json — those must never be cached (medical data).
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallbackDenylist: [/^\/api/, /^\/health/, /^\/docs/, /^\/openapi\.json/],
      },
    }),
  ],
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
