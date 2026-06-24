import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./index.css";

// One-time cleanup: this app used to ship a PWA service worker (removed —
// see CLAUDE.md/README "Фронтенды"). Browsers that visited the old build
// may still have it registered, intercepting requests with its cached
// shell — which looks exactly like a stuck old layout that no code change
// here can fix, since the browser never asks the server for fresh files.
// No-ops for everyone else.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister();
  });
}
if ("caches" in window) {
  caches.keys().then((keys) => {
    for (const key of keys) caches.delete(key);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
