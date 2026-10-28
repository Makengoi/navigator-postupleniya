// Офлайн-режим. Страницы и скрипты: сначала сеть, при ошибке — кэш (так обновления приходят сразу).
// news.js и pages.js тоже идут через сеть с запасным кэшем. При изменении списка файлов поднимите VERSION.
const VERSION = "nav-v4";
const SHELL = ["./", "index.html", "quest.html", "curator.html", "i18n.js", "motion.css", "motion.js", "data.js", "feeds.js", "news.js", "pages.js", "icon.svg", "icon-192.png", "nis-logo.png", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Шрифты Google: кэш, потом сеть
  if (url.host.endsWith("fonts.googleapis.com") || url.host.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  const key = url.pathname.endsWith("news.js") || url.pathname.endsWith("pages.js") ? new Request(url.origin + url.pathname) : e.request;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.match(key, { ignoreSearch: true })));
});
