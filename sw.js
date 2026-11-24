importScripts('version.js');
const CACHE='micmr-'+self.APP_VERSION;
const FILES=['./','index.html','manifest.json','version.js','icon-192.png','icon-512.png','icon-maskable-512.png'];
// Al instalar: baja los archivos saltándose el caché del navegador (GitHub Pages guarda ~10 min)
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>fetch(f,{cache:'reload'}).then(r=>{ if(!r.ok) throw new Error(f); return c.put(f,r); })))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('micmr-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
// La página y la versión: primero la red (siempre lo último); sin red, el caché
function netFirst(r){
  return new Promise(res=>{
    let done=false;
    const fromCache=()=>caches.match(r,{ignoreSearch:true}).then(c=>{ if(c&&!done){ done=true; res(c); } });
    const t=setTimeout(fromCache,3500);
    fetch(r,{cache:'no-store'}).then(x=>{ clearTimeout(t); if(done) return; done=true; const cp=x.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); res(x); })
      .catch(()=>{ clearTimeout(t); caches.match(r,{ignoreSearch:true}).then(c=>{ if(!done){ done=true; res(c||Response.error()); } }); });
  });
}
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    const p=u.pathname;
    if(r.mode==='navigate'||p.endsWith('/')||p.endsWith('/index.html')||p.endsWith('/version.js')||p.endsWith('/manifest.json')){ e.respondWith(netFirst(r)); return; }
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r)));
  } else if(u.hostname.endsWith('googleapis.com')||u.hostname.endsWith('gstatic.com')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(h=>h||fetch(r).then(x=>{c.put(r,x.clone());return x;}).catch(()=>h))));
  }
});
