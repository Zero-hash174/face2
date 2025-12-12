self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
      // إذا ضغط تجاهل، لا نفعل شيئاً سوى الإغلاق
      return;
  }

  // إذا ضغط على الإشعار نفسه أو زر "فتح التطبيق"
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // محاولة التركيز على نافذة مفتوحة
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('call') && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا لم يكن مفتوحاً، افتحه
      if (clients.openWindow) {
        return clients.openWindow('/call');
      }
    })
  );
});