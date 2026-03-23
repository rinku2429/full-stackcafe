console.log('Service Worker Loaded...');

self.addEventListener('push', e => {
    const data = e.data.json();
    console.log('Push Received...');
    
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/images/default.png', // Add a nice icon here
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' } // Allows you to redirect when clicked
    });
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil( clients.openWindow(e.notification.data.url) );
});