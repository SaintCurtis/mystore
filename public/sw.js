// Saint's TechNet — Service Worker
// Handles: PWA offline caching + Web Push notifications

const CACHE_NAME = "saints-technet-v1";

// ── Install ───────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/manifest.json"]);
    })
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

// ── Fetch (basic cache-first for static assets) ───────────────────────────
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached ?? fetch(event.request);
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