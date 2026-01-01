const CACHE_NAME = "study-tracker-cache-v1";
const ASSETS = [
  "/study-tracker/",
  "/study-tracker/index.html",
  "/study-tracker/styles.css",
  "/study-tracker/script.js",
  "/study-tracker/manifest.json",
  "/study-tracker/icons/icon-192.png",
  "/study-tracker/icons/icon-512.png"
  // you can add more static assets here if you want
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cachedRes => {
      return cachedRes || fetch(event.request);
    })
  );
});
