// Service Worker for 42Web.io
// Provides offline support and performance optimizations

const CACHE_NAME = '42web-io-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/about',
    '/services',
    '/contact',
    '/embed',
    '/css/style.css',
    '/js/main.js',
    '/images/og-default.png',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Dynamic caching patterns
const CACHE_STRATEGIES = {
    pages: 'networkFirst',
    api: 'networkFirst',
    static: 'cacheFirst',
    images: 'cacheFirst'
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache static assets', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request)) {
        event.respondWith(cacheFirstStrategy(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (isPageRequest(request)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (isImageRequest(request)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(networkFirstStrategy(request));
    }
});

// Caching strategies

// Cache First - good for static assets
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        return await getOfflineFallback(request);
    }
}

// Network First - good for dynamic content
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            // Don't cache proxy requests or very large responses
            if (!isProxyRequest(request) && networkResponse.headers.get('content-length') < 1024 * 1024) {
                cache.put(request, networkResponse.clone());
            }
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return await getOfflineFallback(request);
    }
}

// Helper functions

function isStaticAsset(request) {
    const url = new URL(request.url);
    return url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/) ||
           url.hostname.includes('cdn.jsdelivr.net') ||
           url.hostname.includes('cdnjs.cloudflare.com');
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') || 
           url.pathname.startsWith('/proxy');
}

function isPageRequest(request) {
    const url = new URL(request.url);
    return request.headers.get('accept')?.includes('text/html') &&
           !url.pathname.startsWith('/api/');
}

function isImageRequest(request) {
    const url = new URL(request.url);
    return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/) ||
           request.headers.get('accept')?.includes('image/');
}

function isProxyRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/proxy');
}

async function getOfflineFallback(request) {
    if (isPageRequest(request)) {
        // Return cached home page as fallback
        const cachedHome = await caches.match('/');
        if (cachedHome) {
            return cachedHome;
        }
        
        // Return offline page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Offline - 42Web.io</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        text-align: center; 
                        padding: 50px; 
                        background: #f8f9fa;
                        color: #212529;
                    }
                    .container { max-width: 500px; margin: 0 auto; }
                    .icon { font-size: 4rem; color: #6c757d; margin-bottom: 1rem; }
                    h1 { color: #0d6efd; margin-bottom: 1rem; }
                    p { color: #6c757d; line-height: 1.6; }
                    .btn { 
                        background: #0d6efd; 
                        color: white; 
                        padding: 12px 24px; 
                        border: none; 
                        border-radius: 8px; 
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                        margin-top: 1rem;
                    }
                    .btn:hover { background: #0b5ed7; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📡</div>
                    <h1>You're Offline</h1>
                    <p>It looks like you're not connected to the internet. Some features may not be available.</p>
                    <p>Please check your connection and try again.</p>
                    <button class="btn" onclick="location.reload()">Try Again</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
            status: 503
        });
    }
    
    if (isImageRequest(request)) {
        // Return placeholder image
        return new Response(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#6c757d" text-anchor="middle" dy=".3em">
                    Image unavailable offline
                </text>
            </svg>
        `, {
            headers: { 'Content-Type': 'image/svg+xml' }
        });
    }
    
    // Generic fallback
    return new Response('Service unavailable offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'contact-form') {
        event.waitUntil(syncContactForm());
    }
});

async function syncContactForm() {
    try {
        // Get pending contact form submissions from IndexedDB
        const pendingSubmissions = await getPendingContactSubmissions();
        
        for (const submission of pendingSubmissions) {
            try {
                await fetch('/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(submission.data)
                });
                
                // Remove from pending list
                await removePendingSubmission(submission.id);
                console.log('Contact form synced successfully');
            } catch (error) {
                console.error('Failed to sync contact form:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Placeholder functions for IndexedDB operations
async function getPendingContactSubmissions() {
    // In a real implementation, this would get data from IndexedDB
    return [];
}

async function removePendingSubmission(id) {
    // In a real implementation, this would remove data from IndexedDB
    return true;
}

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/images/icon-192.png',
            badge: '/images/icon-192.png',
            data: data.data || {},
            actions: [
                {
                    action: 'view',
                    title: 'View',
                    icon: '/images/icon-192.png'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url || '/')
        );
    }
});

console.log('Service Worker: Loaded successfully');
