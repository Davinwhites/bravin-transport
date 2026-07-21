// Minimal service worker — required for "Add to Home Screen" to be installable.
// Caching strategy can be expanded later; for now it just needs to exist and activate.
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
self.addEventListener('fetch', (e) => {
  // Pass-through for now — real offline caching can be added once the maps/ride flow is in.
});
