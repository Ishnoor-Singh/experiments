/*! coi-serviceworker v0.1.7 - Guido Zuidhof and nicholasgriffintn, MIT License */
// This service worker enables cross-origin isolation by intercepting responses
// and adding the necessary COOP and COEP headers.

const CACHE_NAME = "coi-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (ev) => {
  if (ev.data && ev.data.type === "deregister") {
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      });
  }
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.cache === "only-if-cached" && request.mode !== "same-origin") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only modify same-origin responses
        if (response.type === "opaque" || response.type === "opaqueredirect") {
          return response;
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      })
      .catch((e) => {
        console.error("COI Service Worker fetch error:", e);
        throw e;
      })
  );
});
