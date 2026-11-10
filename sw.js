// GlowIA : service worker minimal, nécessaire pour proposer « Installer l'application » sur Android.
// Il ne met rien en cache : tout passe par le réseau, comme sans lui.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(){ /* réseau uniquement */ });
