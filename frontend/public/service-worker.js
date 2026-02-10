const CACHE_NAME = 'ecosync-hub-v1';
const API_CACHE_NAME = 'ecosync-hub-api-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('Failed to cache some assets:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - cache-first for assets, network-first for API
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API calls - network first, fall back to cache
    if (url.pathname.startsWith('/api')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const clonedResponse = response.clone();
                    caches.open(API_CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((response) => {
                        return response || new Response('Offline - No cached data available', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
                })
        );
    }
    // Static assets - cache first
    else if (
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'script' ||
        request.destination === 'style'
    ) {
        event.respondWith(
            caches.match(request).then((response) => {
                return response || fetch(request).then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                });
            })
        );
    }
    // HTML and others - network first
    else {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request) || caches.match('/index.html');
                })
        );
    }
});

// Background sync for messages and posts
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-posts') {
        event.waitUntil(syncPosts());
    } else if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncPosts() {
    try {
        const posts = await getLocalPosts();
        for (const post of posts) {
            await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });
        }
    } catch (err) {
        console.error('Sync posts failed:', err);
    }
}

async function syncMessages() {
    try {
        const messages = await getLocalMessages();
        for (const msg of messages) {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            });
        }
    } catch (err) {
        console.error('Sync messages failed:', err);
    }
}

async function getLocalPosts() {
    return [];
}

async function getLocalMessages() {
    return [];
}

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const options = {
        body: event.data.text(),
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'ecosync-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('EcoSync Hub', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
