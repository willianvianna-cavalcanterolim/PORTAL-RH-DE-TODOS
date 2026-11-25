/* Cavalcante & Rolim | Signature Spaces — Service Worker para Notificações Push (FCM) */
self.addEventListener('push', function (event) {
  let payload = {
    title: 'Cavalcante & Rolim | Signature Spaces',
    body: 'Nova atualização corporativa disponível no Portal.',
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = {
        title: parsed?.notification?.title || parsed?.title || payload.title,
        body: parsed?.notification?.body || parsed?.body || payload.body,
      };
    }
  } catch {
    if (event.data) {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: 'cr-portal-notification',
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
