// Minimal service worker — required to enable PWA install prompt.
// Intentionally does NOT cache navigations to avoid stale content in the Lovable preview.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No-op: let the network handle everything.
});
