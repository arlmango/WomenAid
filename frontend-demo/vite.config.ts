import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Pure visual demo — NO backend, NO dev proxy. Every "request" is served by
// src/lib/mockApi.ts. See README "Демо-версия для презентаций".
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
