importScripts('version.js');
const CACHE='micmr-'+self.APP_VERSION;
const FILES=['./','index.html','manifest.json','version.js','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('micmr-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // version.js siempre fresco si hay red; el resto, desde el caché primero
    if(u.pathname.endsWith('/version.js')){ e.respondWith(fetch(r).catch(()=>caches.match(r))); return; }
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r)));
  } else if(u.hostname.endsWith('googleapis.com')||u.hostname.endsWith('gstatic.com')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(h=>h||fetch(r).then(x=>{c.put(r,x.clone());return x;}).catch(()=>h))));
  }
});
