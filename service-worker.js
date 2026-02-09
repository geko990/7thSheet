const CACHE_NAME = '7th-sea-sheet-v0.9.61';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/config.js',
    './js/router.js',
    './js/storage.js',
    './js/dice.js',
    './js/utils/PasteHandler.js',
    './js/services/SupabaseClient.js',
    './js/services/AuthService.js',
    './js/services/CampaignService.js',
    './js/components/AdventureTab.js',
    './manifest.json',
    './js/components/CreateWizard.js',
    './js/components/CharacterList.js',
    './js/components/CharacterSheet.js',
    './js/components/DiceRoller.js',
    './js/components/Settings.js',
    './js/components/CampaignDetail.js',
    './data/v1/nations.json',
    './data/v1/skills.json',
    './data/v1/schools.json',
    './data/v1/advantages.json',
    './data/v2/nations.json',
    './data/v2/skills.json',
    './data/v2/backgrounds.json',
    './data/v2/advantages.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - Network first for JS/CSS, cache first for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Network first for JS and CSS files
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        // Cache first for other assets
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    return response || fetch(event.request).catch(err => {
                        console.warn('SW Fetch Error:', err);
                        // Optional: return offline placeholder if it's an image
                        return new Response('Network Error', { status: 408, statusText: 'Network Error' });
                    });
                })
        );
    }
});
