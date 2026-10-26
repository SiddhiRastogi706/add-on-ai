/* eslint-disable no-restricted-globals */
// Push service worker: server data-only message bhejta hai, yahan notification dikhate hain

// Link sirf http(s) allow; same-site relative path ko origin se jodte hain
function safeUrl(link) {
  try {
    const url = new URL(link || '/', self.location.origin);
    return /^https?:$/.test(url.protocol) ? url.href : self.location.origin;
  } catch (e) {
    return self.location.origin;
  }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }

  // FCM data-only payload "data" ke andar aata hai
  const data = payload.data || payload.notification || payload;
  const title = data.title || 'Addon AI';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: { link: safeUrl(data.link) },
    })
  );
});

// Notification par click karte hi website khule (ya pehle se khuli tab focus ho)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.link) || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
