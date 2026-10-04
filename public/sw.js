// Saint's TechNet — Service Worker
// Handles: PWA offline caching + Web Push notifications

// Bumped to v4 to force-purge anything poisoned under v3 by the bug fixed
// below — bumping the name is what actually evicts old entries; without it
// a bad cached response for an existing user just sits there forever even
// after this file changes, since only entries under a NEW cache name get a
// fresh start (see the `activate` handler).
const CACHE_NAME = "saints-technet-v4";

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
//
// 3. Next.js App Router client-side transitions — tapping a <Link>, a
//    router.push(), or Next's own background prefetching (this is how
//    Clerk's UserButton.Link navigates too) — are a THIRD category that
//    the original two-way split above missed entirely. These never look
//    like a `navigate` request (the browser's address bar never actually
//    navigates; Next intercepts the click and fetches the target route's
//    RSC payload in the background), so they fell into the cache-first
//    bucket meant for hashed static assets. That's the same trap as #1,
//    just in a shape that's easy to miss: if a route's RSC fetch was ever
//    cached while something was wrong (mid-deploy, a route that didn't
//    exist yet, a redirect), every future tap on that link replays the
//    same broken response forever — indistinguishable, from the outside,
//    from "the link doesn't go anywhere." Treating these as network-first
//    like real navigations closes that hole.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.destination === "document");

  const isNextRouterFetch =
    event.request.headers.has("RSC") ||
    event.request.headers.has("Next-Router-State-Tree") ||
    event.request.headers.has("Next-Router-Prefetch") ||
    url.searchParams.has("_rsc");

  if (isNavigation || isNextRouterFetch) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only ever cache a real, successful full-page navigation for
          // offline fallback — never an RSC fetch/prefetch payload, and
          // never a redirect or error response either.
          if (isNavigation && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // An offline fallback only makes sense for a real page load —
          // an RSC fetch failing offline should just fail, not resolve to
          // some other route's cached HTML.
          if (isNavigation) {
            return caches.match(event.request).then((cached) => cached ?? caches.match("/"));
          }
          return Response.error();
        })
    );
    return;
  }

  // 4. Cache-first below is only ever safe for THIS origin's genuinely
  //    static, content-hashed assets (_next/static chunks, icons, fonts).
  //    As written until now, nothing stopped it from also catching
  //    cross-origin requests — Clerk's own session/auth check calls,
  //    analytics scripts, Paystack, Sanity — or same-origin /api/ routes,
  //    which are never content-hashed and change on every request by
  //    design. That's the same trap as #1 and #3 above, just one layer
  //    deeper: any GET that returns 200 gets cached and replayed forever
  //    regardless of whether the thing behind it changes. For a static
  //    asset that's harmless. For Clerk checking whether the session is
  //    still valid, it means the browser can get stuck looking at a
  //    frozen snapshot of auth state indefinitely — most visible right
  //    after returning from an external redirect (like Paystack's
  //    checkout), which is exactly when Clerk's JS re-initializes and
  //    asks again. Same for /api/customer/* routes: the server-side fixes
  //    elsewhere in this codebase that make sure THOSE stay fresh are
  //    wasted if the browser never actually asks again to find out.
  const isCacheableStaticAsset =
    url.origin === self.location.origin && !url.pathname.startsWith("/api/");

  if (!isCacheableStaticAsset) {
    event.respondWith(fetch(event.request));
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
