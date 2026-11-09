"use strict";
/* Forex Kill Zone — service worker.
   Yangi versiya chiqarganda 3 joyda BIR XIL raqam qo‘ying:
   1) shu fayldagi VER   2) app.js dagi APP_VER   3) index.html dagi style.css?v= va app.js?v= */
const VER = "v27";
const SHELL = "kz-shell-" + VER;   // index.html, css, js, manifest, ikonka
const RUNTIME = "kz-fonts";        // Google Fonts (versiyaga bog‘liq emas)
const CORE = ["manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    const urls = [...CORE];
    // index.html ni olib, undan style.css?v=.. va app.js?v=.. havolalarini o‘zi topadi
    const r = await fetch("index.html", { cache: "reload" });
    if (r.ok) {
      const html = await r.clone().text();
      await c.put("index.html", r);
      for (const m of html.matchAll(/(?:href|src)="((?!https?:|\/\/)[^"#]+?\.(?:css|js)(?:\?[^"]*)?)"/g)) urls.push(m[1]);
    }
    // bittasi (masalan icon-512.png) yo‘q bo‘lsa ham o‘rnatish to‘xtamaydi
    await Promise.allSettled(urls.map(u => c.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, RUNTIME]);
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;                 // PUT/POST (GitHub saqlash) tegilmaydi
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  const font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!same && !font) return;                       // api.github.com va boshqalar doim to‘g‘ridan-to‘g‘ri tarmoqqa

  if (req.mode === "navigate") { e.respondWith(page(req)); return; }
  e.respondWith(swr(e, req, same ? SHELL : RUNTIME));
});

// Sahifa: avval tarmoq (yangi versiya), internet yo‘q bo‘lsa keshdagi index.html
async function page(req) {
  try {
    const r = await fetch(req);
    if (r.ok) (await caches.open(SHELL)).put("index.html", r.clone());
    return r;
  } catch (_) {
    return (await caches.match("index.html", { ignoreSearch: true })) || Response.error();
  }
}

// Fayllar: keshdan darhol, orqada yangilab qo‘yadi
async function swr(e, req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  const net = fetch(req).then(r => {
    if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone());
    return r;
  }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || Response.error();
}
