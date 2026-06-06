/**
 * DevMode — developer utilities (logic only).
 * UI is handled entirely by SettingsPanel (the gear icon drawer).
 *
 * Activation:
 *   • Settings panel → Dev Tools toggle
 *   • URL: ?dev=1
 *   • Console: DevMode.enable()
 *   • Keyboard: Ctrl+Shift+D
 */
const DevMode = (() => {

    function isActive() {
        return window.SettingsPanel?.get('devMode') ?? false;
    }

    function enable() {
        window.SettingsPanel?.set('devMode', true);
        console.log('[DevMode] enabled — Ctrl+Shift+D to toggle, Ctrl+Shift+, for settings panel');
    }

    function disable() {
        window.SettingsPanel?.set('devMode', false);
    }

    function toggle() { isActive() ? disable() : enable(); }

    // ── Actions ────────────────────────────────────────────────────────────
    function unlockAll() {
        if (typeof LessonsData === 'undefined' || typeof ProgressStore === 'undefined') {
            console.warn('[DevMode] LessonsData / ProgressStore not ready');
            return;
        }
        const lessons = LessonsData.getAll();
        const raw  = localStorage.getItem('piano-progress-v1');
        const data = raw ? JSON.parse(raw) : {
            completedLessons: {}, xp: 0, streakDays: 1,
            lastActiveDate: null, badges: [], totalSessions: 0,
        };
        lessons.forEach(l => {
            if (!data.completedLessons[l.id]) {
                data.completedLessons[l.id] = {
                    score: 100, stars: 3, accuracy: 1,
                    completedAt: new Date().toISOString(), xpGain: l.xp || 0,
                };
                data.xp += l.xp || 0;
            }
        });
        localStorage.setItem('piano-progress-v1', JSON.stringify(data));
        AppShell?.updateStats?.();
        HomeView?.render?.();
        console.log('[DevMode] unlocked', lessons.length, 'lessons');
    }

    function resetProgress() {
        if (typeof ProgressStore === 'undefined') return;
        ProgressStore.reset();
        AppShell?.updateStats?.();
        HomeView?.render?.();
        console.log('[DevMode] progress reset');
    }

    function skipStep() {
        const btn = document.getElementById('lv-next');
        if (!btn) { console.warn('[DevMode] no active lesson'); return; }
        btn.disabled = false;
        btn.click();
        console.log('[DevMode] skipped step');
    }

    function gotoLesson(id) {
        if (!id) return;
        if (typeof Router === 'undefined' || typeof LearnView === 'undefined') {
            console.warn('[DevMode] Router / LearnView not ready');
            return;
        }
        Router.go('learn');
        setTimeout(() => LearnView.startLesson(id), 120);
        console.log('[DevMode] goto lesson:', id);
    }

    function connectMidi() {
        if (typeof InputRouter === 'undefined') { console.warn('[DevMode] InputRouter not ready'); return; }
        if (!navigator.requestMIDIAccess) {
            console.warn('[DevMode] Web MIDI not supported');
            return;
        }
        InputRouter.enableMidi().then(ok => {
            console.log('[DevMode] MIDI', ok ? 'connected' : 'failed');
        });
    }

    // ── MIDI stat pill in top-bar ──────────────────────────────────────────
    function _updateTopBarMidi(state) {
        const pill = document.getElementById('stat-midi');
        if (!pill) return;
        if (state?.midi && state.midiDevices?.length) {
            const name = state.midiDevices[0].name.split(' ').slice(0, 2).join(' ');
            pill.textContent = '🎹 ' + name;
            pill.classList.remove('hidden');
        } else {
            pill.classList.add('hidden');
        }
    }

    // ── Keyboard shortcut ──────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggle();
        }
    });

    // ── Auto init ──────────────────────────────────────────────────────────
    function _autoInit() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('dev') || params.get('dev') === '1') enable();

        // Wire MIDI pill — works regardless of dev mode state
        if (typeof InputRouter !== 'undefined') {
            InputRouter.onStateChange(st => {
                _updateTopBarMidi(st);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _autoInit);
    } else {
        setTimeout(_autoInit, 0);
    }

    return { enable, disable, toggle, isActive, unlockAll, resetProgress, skipStep, gotoLesson, connectMidi };
})();
