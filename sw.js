/* TURBO MAZE — service worker  ·  (c) 2026 Corrupt Solutions LLC  ·  see LICENSE
   ────────────────────────────────────────────────────────────────────────────
   PURPOSE
     1. Offline play — the whole game is one self-contained index.html, so caching
        the shell means it launches with no signal (airport, subway, dead zone).
     2. PWA installability — Android Chromium only fires `beforeinstallprompt` and
        only surfaces "Install app" once a site controls a service worker. This file
        is what lights up the existing Add-to-Home-Screen coach (see ▸a2hsCoach in
        index.html) and the browser's own install button.

   CACHING STRATEGY (only ever touches SAME-ORIGIN GET — see the fetch handler)
     • navigations (the game HTML)  → NETWORK-FIRST: an online player ALWAYS gets the
       newest build (this game ships often); an offline player falls back to the last
       cached copy. No "stuck a version behind" trap.
     • other same-origin assets (icons, manifest, vendored supabase.umd.js)
                                    → STALE-WHILE-REVALIDATE: served instantly from
       cache, refreshed in the background for the next launch.
     • everything else — the 4-word sync POST, all cross-origin Supabase/Google auth —
       is NOT intercepted and hits the network exactly as before.

   UPDATES  (prompt mode — the nudge lives in the registration block in index.html)
     A freshly-installed worker parks in "waiting" instead of jumping the queue; the page
     notices it and shows a "New version ready — REFRESH" toast. Tapping it posts a
     SKIP_WAITING message (handled below) so the new worker activates, and the page then
     reloads once on controllerchange. We deliberately do NOT skipWaiting() on install —
     that would swap versions out from under a mid-session player. Bump CACHE_VERSION when
     the precached shell list changes; that also changes THIS file, which is what makes the
     browser notice an update and fire the nudge. Navigations are network-first regardless,
     so players still get fresh HTML on the next launch — the nudge is the in-session offer.
*/
const CACHE_VERSION = "v1";
const CACHE_NAME    = `turbo-maze-${CACHE_VERSION}`;

// The offline shell, precached at install so the very FIRST offline launch works even
// if the player never happened to re-request a given file. Relative paths (resolved
// against this worker's URL) so a root OR subdirectory deploy both work. Keep this to
// files known to exist — a single 404 in cache.add would reject that item (we swallow
// it per-item below so one missing asset can't fail the whole install).
const PRECACHE = [
  "./",                    // start_url ("." in manifest.json) → the game HTML
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./favicon.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Add each item on its own so a missing/renamed asset can't sink the whole install.
    await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    // No skipWaiting() here — a fresh worker parks in "waiting" so the page can offer its
    // update nudge first (prompt mode). The very first install still activates right away
    // anyway: with no old worker to wait behind, the browser promotes it immediately.
  })());
});

// Prompt-mode handoff: the page posts this when the player taps REFRESH on the update
// toast — only then do we jump the queue and activate, triggering controllerchange → reload.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();               // drop every stale versioned cache
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();                     // control already-open pages now
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Never touch non-GET (the 4-word sync POST) or cross-origin (Supabase / Google auth,
  // a configured workers.dev sync endpoint) — let them go straight to the network.
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  // Page navigations → network-first, cache fallback when offline.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());   // refresh the offline copy
        return fresh;
      } catch (e) {
        return (await cache.match(req)) || (await cache.match("./")) || Response.error();
      }
    })());
    return;
  }

  // Other same-origin assets → stale-while-revalidate.
  event.respondWith((async () => {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
      .catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
