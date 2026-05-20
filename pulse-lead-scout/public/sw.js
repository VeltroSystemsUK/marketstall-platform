const CACHE = "pulse-lead-scout-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  // Never intercept API calls
  if (e.request.url.includes("/api/")) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
