/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
};

self.addEventListener('push', (event) => {
  let data: PushPayload = { title: 'שוטגן' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    data = { title: event.data?.text() || 'שוטגן' };
  }
  const { title, body, url, tag } = data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | null)?.url ?? '/';
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clientsArr) {
      if ('focus' in c) {
        await (c as WindowClient).focus();
        if ('navigate' in c) await (c as WindowClient).navigate(url).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
