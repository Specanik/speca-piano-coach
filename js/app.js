// Entry point — all logic lives in AppShell and view modules.
window.addEventListener('DOMContentLoaded', () => {
    AppShell.boot();

    // Register service worker for PWA/offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .catch(() => { /* SW not critical */ });
    }
});
