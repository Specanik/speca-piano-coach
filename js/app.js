// Entry point — all logic lives in AppShell and view modules.
window.addEventListener('DOMContentLoaded', () => {
    // Animate splash bar to signal scripts are running
    const bar = document.getElementById('splash-bar');
    if (bar) bar.style.width = '60%';

    // Init settings before boot so AppShell reads correct localStorage values
    SettingsPanel.init();

    AppShell.boot();

    // Hide splash after boot; also apply post-boot settings (e.g. hand split, speed mult)
    requestAnimationFrame(() => {
        SettingsPanel.applyAll();
        if (bar) bar.style.width = '100%';
        setTimeout(() => {
            const splash = document.getElementById('splash');
            if (splash) {
                splash.style.opacity = '0';
                splash.style.visibility = 'hidden';
                setTimeout(() => splash.remove(), 380);
            }
        }, 200);
    });

    // Register service worker for PWA/offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .catch(() => { /* SW not critical */ });
    }
});
