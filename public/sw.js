// Saint's TechNet — Service Worker
// Handles: PWA offline caching + Web Push notifications

const CACHE_NAME = "saints-technet-v2";

// ── Install ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add("/manifest.json").catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────
// Two different strategies on purpose:
//
// 1. Navigation requests (the page HTML itself) go NETWORK-FIRST. This is
//    the fix: the previous version cached "/" on install and served that
//    cached HTML forever afterward, cache-first, on every visit — so every
//    deploy after the first left visitors stuck on an old page that
//    referenced JS/CSS chunk files which no longer exist on the server
//    (Next.js content-hashes those filenames per build). That mismatch is
//    what was throwing "Failed to load chunk" and crashing the app.
//    Network-first means every visit gets the CURRENT deployment's HTML;
//    the cache is only a fallback for when the network request fails
//    (genuinely offline), which is the actual point of a PWA cache.
//
// 2. Everything else (JS/CSS chunks, images, fonts) is cache-first. This
//    is safe specifically because those URLs are content-hashed by
//    Next.js — a given URL never changes meaning across deploys, so
//    serving a cached copy is never "stale," it's just fast. (The
//    previous version claimed to do this but never actually called
//    cache.put(), so nothing beyond "/" and manifest.json was ever
//    really cached — fixed here too.)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.destination === "document");

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached ?? caches.match("/"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

// ── Push notification received ────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Saint's TechNet", body: "You have a new notification", url: "/admin/negotiations" };

  try {
    if (event.data) {
      data = { ...data, ...JSON.parse(event.data.text()) };
    }
  } catch {
    // Use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/android-chrome-192x192.png",
      badge: "/icons/favicon-32x32.png",
      tag: "negotiation-alert",       // replaces previous alert instead of stacking
      renotify: true,                 // vibrate/sound even if same tag
      requireInteraction: true,       // stays visible until tapped (important on mobile)
      data: { url: data.url },
    })
  );
});

// ── Notification click — open/focus admin page ────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/admin/negotiations";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If admin tab is already open, focus it
      for (const client of clientList) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return clients.openWindow(url);
    })
  );
});
