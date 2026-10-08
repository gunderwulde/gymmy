const CACHE_VERSION = "gymmy-shell-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/main.js",
  "./src/catalog.js",
  "./src/storage.js",
  "./src/ui.js",
  "./data/exercises.json",
  "./assets/icons/gymmy-192.svg",
  "./assets/icons/gymmy-512.svg",
  "./assets/icons/gymmy-maskable.svg",
  "./assets/icons/image-placeholder.svg",
  "./assets/exercises/press-banca.svg",
  "./assets/exercises/pec-deck.svg",
  "./assets/exercises/cruce-poleas.svg",
  "./assets/exercises/jalon-polea.svg",
  "./assets/exercises/remo-sentado.svg",
  "./assets/exercises/press-hombros.svg",
  "./assets/exercises/curl-biceps.svg",
  "./assets/exercises/triceps-polea.svg",
  "./assets/exercises/sentadilla.svg",
  "./assets/exercises/prensa-piernas.svg",
  "./assets/exercises/curl-femoral.svg",
  "./assets/exercises/peso-muerto.svg",
  "./assets/exercises/plancha.svg",
  "./assets/exercises/bicicleta-estatica.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("gymmy-shell-") && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match("./index.html").then((cached) => cached || fetch(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
