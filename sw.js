/**
 * Service Worker — offline support for Piano Coach.
 * Caches all core assets on install; serves from cache when offline.
 */
const CACHE_NAME = 'piano-coach-v2';

const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/css/lesson.css',
    '/css/app-shell.css',
    '/css/learn-view.css',
    '/js/audio.js',
    '/js/keyboard.js',
    '/js/visualizer.js',
    '/js/chords.js',
    '/js/chordPlayer.js',
    '/js/songParser.js',
    '/js/songAccompaniment.js',
    '/js/songPlayer.js',
    '/js/chordUI.js',
    '/js/songUI.js',
    '/js/progressionPlayer.js',
    '/js/midi.js',
    '/js/pitchDetector.js',
    '/js/inputRouter.js',
    '/js/noteHighlighter.js',
    '/js/scorer.js',
    '/js/lessonEngine.js',
    '/js/progressStore.js',
    '/js/router.js',
    '/js/metronome.js',
    '/js/fallingNotes.js',
    '/js/appShell.js',
    '/js/app.js',
    '/js/views/homeView.js',
    '/js/views/learnView.js',
    '/js/views/profileView.js',
    '/js/views/onboarding.js',
    '/js/views/songsView.js',
    '/data/lessons.js',
    '/data/songs.js',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(k => k !== CACHE_NAME)
                .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    // Network first for API/dynamic; cache first for static assets
    const url = new URL(event.request.url);

    // Skip non-GET and cross-origin
    if (event.request.method !== 'GET' || url.origin !== location.origin) return;

    // Cache-first for JS/CSS/HTML assets
    if (url.pathname.match(/\.(js|css|html|json|mp3|png|jpg|svg|ico)$/)) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Default: network with cache fallback
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
