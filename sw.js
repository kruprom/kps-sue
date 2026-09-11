/* ระบบครูพร้อมสอน — Service Worker (เปิดหน้าเว็บได้แม้ไม่มีเน็ต) */
const CACHE = 'kps-shell-v12';   // ⚡ v12.0 — เปลี่ยนชื่อแคชเพื่อให้เครื่องลูกค้าทิ้ง shell เก่า (v11) แล้วโหลดหน้าใหม่

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.json']).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;   // API (GAS)/ฟอนต์/CDN → เน็ตตรง ไม่ยุ่ง

  if (e.request.mode === 'navigate') {
    // หน้าเว็บ: เอาสดก่อน (ได้เวอร์ชันใหม่เสมอเมื่อออนไลน์) → ไม่มีเน็ตใช้ตัวที่เก็บไว้
    e.respondWith(
      fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put('./', cp)).catch(() => {});
        return res;
      }).catch(() => caches.match('./', { ignoreSearch: true }))
    );
    return;
  }
  // ไฟล์อื่นในโดเมนเดียวกัน: แคชก่อน → ไม่มีค่อยเน็ต
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
      return res;
    }).catch(() => caches.match('./')))
  );
});
