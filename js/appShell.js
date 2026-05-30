/**
 * AppShell — orchestrates the entire app.
 * Initialises all modules, wires navigation, manages top-bar stats.
 */
const AppShell = (() => {

    // ── Top bar stats ─────────────────────────────────────────────
    function updateStats() {
        const stats = ProgressStore.getStats();

        const streakEl = document.getElementById('stat-streak');
        if (streakEl) {
            streakEl.textContent = `🔥 ${stats.streakDays}`;
            streakEl.classList.toggle('active-streak', stats.streakDays >= 3);
        }

        const xpEl = document.getElementById('stat-xp');
        if (xpEl) xpEl.textContent = `⚡ ${stats.xp}`;
    }

    // ── Practice view tab switching ────────────────────────────────
    function _initPracticeTabs() {
        const tabs = {
            piano:  document.getElementById('practice-piano-tab'),
            chords: document.getElementById('practice-chords-tab'),
            songs:  document.getElementById('practice-songs-tab'),
            theory: document.getElementById('practice-theory-tab'),
        };

        document.querySelectorAll('.practice-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.ptab;
                document.querySelectorAll('.practice-tab').forEach(b =>
                    b.classList.toggle('active', b.dataset.ptab === target)
                );
                Object.entries(tabs).forEach(([k, el]) => {
                    if (!el) return;
                    el.classList.toggle('hidden', k !== target);
                    el.style.display = k === target ? '' : 'none';
                });
            });
        });

        // Default: show piano tab
        Object.entries(tabs).forEach(([k, el]) => {
            if (!el) return;
            el.style.display = k === 'piano' ? '' : 'none';
        });
    }

    // ── MIDI / Mic toggles ─────────────────────────────────────────
    function _initInputToggles() {
        let midiOn = false, micOn = false;

        document.getElementById('midi-toggle-btn')?.addEventListener('click', async () => {
            if (!MidiInput.isSupported()) {
                alert('Web MIDI API không hỗ trợ. Dùng Chrome/Edge.');
                return;
            }
            midiOn = !midiOn;
            if (midiOn) {
                const ok = await InputRouter.enableMidi();
                midiOn = ok;
                if (!ok) { midiOn = false; alert('Không thể kết nối MIDI.'); }
            } else {
                InputRouter.disableMidi();
            }
            document.querySelectorAll('#midi-toggle-btn').forEach(b =>
                b.classList.toggle('active', midiOn)
            );
        });

        document.getElementById('mic-toggle-btn')?.addEventListener('click', async () => {
            micOn = !micOn;
            if (micOn) {
                const ok = await InputRouter.enableMic();
                micOn = ok;
                if (!ok) { micOn = false; alert('Không thể truy cập microphone.'); }
            } else {
                InputRouter.disableMic();
            }
            document.querySelectorAll('#mic-toggle-btn').forEach(b =>
                b.classList.toggle('active', micOn)
            );
        });
    }

    // ── Metronome toggle ───────────────────────────────────────────
    function _initMetronome() {
        const bar = document.getElementById('metronome-bar');
        let bpm   = 80;

        // Build metronome bar HTML
        if (bar) {
            bar.innerHTML = `
                <div class="metro-beats" id="metro-beats">
                    <div class="metro-beat" id="mb0"></div>
                    <div class="metro-beat" id="mb1"></div>
                    <div class="metro-beat" id="mb2"></div>
                    <div class="metro-beat" id="mb3"></div>
                </div>
                <div class="metro-bpm-ctrl">
                    <button class="metro-bpm-btn" id="metro-slower">−</button>
                    <span class="metro-bpm-val" id="metro-bpm-val">${bpm}</span>
                    <button class="metro-bpm-btn" id="metro-faster">+</button>
                </div>`;

            document.getElementById('metro-slower')?.addEventListener('click', () => {
                bpm = Math.max(40, bpm - 5);
                document.getElementById('metro-bpm-val').textContent = bpm;
                if (Metronome.isPlaying()) { Metronome.stop(); Metronome.start(bpm); }
            });
            document.getElementById('metro-faster')?.addEventListener('click', () => {
                bpm = Math.min(240, bpm + 5);
                document.getElementById('metro-bpm-val').textContent = bpm;
                if (Metronome.isPlaying()) { Metronome.stop(); Metronome.start(bpm); }
            });
        }

        document.getElementById('metronome-toggle-btn')?.addEventListener('click', () => {
            const btn = document.getElementById('metronome-toggle-btn');
            if (Metronome.isPlaying()) {
                Metronome.stop();
                if (bar) bar.classList.add('hidden');
                btn?.classList.remove('active');
            } else {
                Metronome.start(bpm);
                if (bar) bar.classList.remove('hidden');
                btn?.classList.add('active');
            }
        });

        Metronome.onBeat((beatIdx, isDownbeat) => {
            const beat = document.getElementById(`mb${beatIdx}`);
            if (!beat) return;
            beat.classList.add('down');
            setTimeout(() => beat.classList.remove('down'), 120);
        });
    }

    // ── Bottom nav ─────────────────────────────────────────────────
    function _initNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view === 'learn' && Router.current() !== 'learn') {
                    Router.go('learn');
                    setTimeout(() => LearnView.showList(), 50);
                } else {
                    Router.go(view);
                }
            });
        });

        document.getElementById('logo-btn')?.addEventListener('click', () => {
            Router.go('home');
        });

        Router.onNavigate((view, prev) => {
            // When leaving learn view, stop falling notes
            if (prev === 'learn') {
                FallingNotes.stop();
                NoteHighlighter.clearTarget();
            }
            // Render views on demand
            if (view === 'home')    setTimeout(() => HomeView.render(), 20);
            if (view === 'profile') setTimeout(() => ProfileView.render(), 20);
            if (view === 'learn' && Router.current() === 'learn') {
                // LearnView shows list by default
            }
        });
    }

    // ── Piano (practice view) ──────────────────────────────────────
    function _initPiano() {
        const savedLayout = localStorage.getItem('piano-layout') || '36';
        const savedTheme  = localStorage.getItem('piano-theme')  || 'classic';

        // Theme
        document.body.dataset.theme = savedTheme;
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === savedTheme);
            btn.addEventListener('click', () => {
                document.body.dataset.theme = btn.dataset.theme;
                localStorage.setItem('piano-theme', btn.dataset.theme);
                document.querySelectorAll('.theme-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.theme === btn.dataset.theme)
                );
            });
        });

        // Layout
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === savedLayout);
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                localStorage.setItem('piano-layout', layout);
                document.querySelectorAll('.layout-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.layout === layout)
                );
                _renderPiano(layout);
            });
        });

        _renderPiano(savedLayout);
    }

    function _renderPiano(layout) {
        const container = document.getElementById('keyboard');
        if (!container) return;
        // Temporarily make visible for measurement if needed
        const wasHidden = container.offsetParent === null;
        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render('keyboard', layout);
        Visualizer.init(canvas, noteMap);
        if (wasHidden) {
            // Resize canvas after view becomes visible
            Router.onNavigate(v => {
                if (v === 'practice') {
                    setTimeout(() => {
                        Visualizer.destroy();
                        const r = Keyboard.render('keyboard', layout);
                        Visualizer.init(r.canvas, r.noteMap);
                    }, 50);
                }
            });
        }
    }

    // ── InputRouter wiring ─────────────────────────────────────────
    function _initInputRouter() {
        InputRouter.attachKeyboard();

        // Free-play: route to audio + visualizer + lesson engine
        InputRouter.onNoteOn(midi => {
            AudioEngine.startNote(midi, midi);
            Visualizer.noteOn(midi);
            NoteHighlighter.noteOn(midi);
            FallingNotes.noteOn(midi);
            LessonEngine.noteOn(midi);
        });

        InputRouter.onNoteOff(midi => {
            AudioEngine.stopNote(midi);
            Visualizer.noteOff(midi);
            NoteHighlighter.noteOff(midi);
            FallingNotes.noteOff(midi);
            LessonEngine.noteOff(midi);
        });

        // ChordPlayer highlight sync
        let chordVisNotes = new Set();
        ChordPlayer.onNotesChangeHandler(midiNotes => {
            if (typeof ChordUI !== 'undefined') ChordUI.updateKeyboardHighlight(midiNotes);

            const next = new Set(midiNotes);
            chordVisNotes.forEach(midi => { if (!next.has(midi)) Visualizer.noteOff(midi); });
            midiNotes.forEach(midi => { if (!chordVisNotes.has(midi)) Visualizer.noteOn(midi); });
            chordVisNotes = next;
        });
    }

    // ── Register Router views ──────────────────────────────────────
    function _registerViews() {
        Router.registerView('home',    () => HomeView.render());
        Router.registerView('learn',   () => LearnView.showList());
        Router.registerView('profile', () => ProfileView.render());
        Router.registerView('practice', () => {
            // ChordUI init (only once)
            try { ChordUI.init(); } catch(e) { console.warn('ChordUI init:', e); }
            try { SongUI.init(); } catch(e) { }
            try { ProgressionPlayer.init(); } catch(e) { }
        });
    }

    // ── Boot ───────────────────────────────────────────────────────
    function boot() {
        updateStats();
        _initNav();
        _initPracticeTabs();
        _initInputToggles();
        _initMetronome();
        _initPiano();
        _initInputRouter();
        _registerViews();

        LearnView.init();

        // Onboarding check
        if (Onboarding.shouldShow()) {
            Onboarding.show();
        } else {
            Router.restore();
        }
    }

    return { boot, updateStats };
})();
