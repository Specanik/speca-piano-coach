/**
 * Onboarding — 3-step welcome flow for new users.
 * Shows once on first visit (stored in localStorage).
 * Mic permission requested silently in slide 3.
 */
const Onboarding = (() => {
    const KEY = 'piano-onboarded-v1';
    let _slide = 0;

    function shouldShow() {
        return !localStorage.getItem(KEY);
    }

    function markDone() {
        localStorage.setItem(KEY, '1');
    }

    function show() {
        const overlay = document.getElementById('onboarding-overlay');
        if (!overlay) return;
        overlay.classList.remove('hidden');
        _slide = 0;
        _updateDots();
        _bindEvents();
    }

    function hide() {
        const overlay = document.getElementById('onboarding-overlay');
        overlay?.classList.add('hidden');
        markDone();
    }

    function _updateDots() {
        document.querySelectorAll('.onboarding-dot').forEach((d, i) => {
            d.classList.toggle('active', i === _slide);
        });
    }

    function _goTo(n) {
        document.querySelectorAll('.onboarding-slide').forEach((s, i) => {
            s.classList.toggle('active', i === n);
        });
        _slide = n;
        _updateDots();

        // Slide 3: pre-request mic permission silently
        if (n === 2) {
            navigator.mediaDevices?.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(t => t.stop());
                })
                .catch(() => { /* permission denied — OK */ });
        }
    }

    function _bindEvents() {
        document.getElementById('ob-next-0')
            ?.addEventListener('click', () => _goTo(1));
        document.getElementById('ob-next-1')
            ?.addEventListener('click', () => _goTo(2));
        document.getElementById('ob-next-2')
            ?.addEventListener('click', () => { hide(); Router.go('home'); });
        document.getElementById('ob-skip')
            ?.addEventListener('click', () => { hide(); Router.go('home'); });
    }

    return { shouldShow, show, hide };
})();
