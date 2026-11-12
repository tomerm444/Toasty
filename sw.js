// טוסטי הגיבור — service worker: keeps the game playable offline after the first visit.
// After changing any game file, bump VERSION so installed copies pick up the new files.
const VERSION = 'toasty-v4';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './engine.js', './meshes.js', './world.js', './main.js',
  './vendor/three.min.js', './vendor/RoundedBoxGeometry.js', './vendor/BufferGeometryUtils.js',
  './vendor/CopyShader.js', './vendor/LuminosityHighPassShader.js', './vendor/EffectComposer.js',
  './vendor/RenderPass.js', './vendor/ShaderPass.js', './vendor/UnrealBloomPass.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // pages and game code: network first (so updates arrive), cache when offline
  const local = new URL(req.url).origin === location.origin;
  if (req.mode === 'navigate' || (local && /\.(js|html|webmanifest)$/.test(new URL(req.url).pathname))) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // icons, fonts and everything else: cache first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
