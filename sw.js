const CACHE_NAME = 'question-shuffler-v3';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './questions.yml',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js'
];

// Install - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                // For questions.yml, try network first to get updates
                if (event.request.url.includes('questions.yml')) {
                    return fetch(event.request)
                        .then(response => {
                            const clone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, clone));
                            return response;
                        })
                        .catch(() => cached);
                }
                return cached || fetch(event.request);
            })
    );
});
