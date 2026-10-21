// オフラインでも開けるよう画面一式を保存し、通知をタップしたときにタイマーを開く
const CACHE = 'vtimer-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './badge-96.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// 新しい版があれば取得して使い、つながらないときは保存済みを使う
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
  );
});
// 通知をタップ：開いているタイマーがあればそこへ、なければ公開済みのタイマーのページを開く
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL('./index.html', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus().catch(() => self.clients.openWindow(url));
      }
      return self.clients.openWindow(url);
    })
  );
});
