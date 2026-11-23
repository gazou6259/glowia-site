// GlowIA : service worker de l'espace gérante.
// Il ne met rien en cache (tout passe par le réseau) ; il affiche les notifications de l'espace.
var LIRE = 'https://n8n-cpov.srv2127351.hstgr.cloud/webhook/push-lire-glowia';

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(){ /* réseau uniquement */ });

// Une notification arrive (sans contenu) : on demande au serveur quoi afficher, puis on l'affiche toujours.
self.addEventListener('push', function(e){
  e.waitUntil(
    self.registration.pushManager.getSubscription().then(function(sub){
      return fetch(LIRE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub ? sub.endpoint : '' }) });
    }).then(function(r){ return r.json(); }).catch(function(){ return null; }).then(function(n){
      n = n || {};
      return self.registration.showNotification(n.titre || 'GlowIA', {
        body: n.texte || 'Ouvrez votre espace pour voir les nouveautés.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: n.tag || 'glowia',
        data: { url: n.url || '/portail' }
      });
    })
  );
});

// Un appui sur la notification ouvre l'espace (ou le ramène devant s'il est déjà ouvert).
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/portail';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(liste){
      for (var i = 0; i < liste.length; i++) {
        if (liste[i].url.indexOf('/portail') !== -1 && 'focus' in liste[i]) { liste[i].navigate && liste[i].navigate(url).catch(function(){}); return liste[i].focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
