/**
 * AppShell — orchestrates the entire app.
 * Initialises all modules, wires navigation, manages top-bar stats.
 *
 * BUG FIXES vs previous version:
 * - Router.onNavigate called once (was overwritten by _renderPiano)
 * - Piano re-render moved into onNavigate (not inside _renderPiano)
 * - Practice tab switching uses classList, not conflicting display+hidden
 */
const AppShell = (() => {

    let _currentPianoLayout = '36';

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
        const tabMap = {
            piano:  document.getElementById('practice-piano-tab'),
            chords: document.getElementById('practice-chords-tab'),
            songs:  document.getElementById('practice-songs-tab'),
            midi:   document.getElementById('practice-midi-tab'),
            theory: document.getElementById('practice-theory-tab'),
        };

        // Initial state: show piano tab, hide others
        Object.entries(tabMap).forEach(([k, el]) => {
            if (!el) return;
            if (k === 'piano') {
                el.classList.remove('hidden');
                el.style.display = '';
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
            }
        });

        document.querySelectorAll('.practice-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.ptab;
                // Update tab buttons
                document.querySelectorAll('.practice-tab').forEach(b =>
                    b.classList.toggle('active', b.dataset.ptab === target)
                );
                // Show/hide tab panels — use BOTH class and inline style to avoid conflicts
                Object.entries(tabMap).forEach(([k, el]) => {
                    if (!el) return;
                    if (k === target) {
                        el.classList.remove('hidden');
                        el.style.display = 'flex';
                        el.style.flexDirection = 'column';
                        el.style.flex = '1';
                        el.style.minHeight = '0';
                    } else {
                        el.classList.add('hidden');
                        el.style.display = 'none';
                    }
                });

                // Lazy init on first visit
                if (target === 'chords') {
                    try { ChordUI.init(); } catch(e) { console.warn('ChordUI:', e); }
                }
                if (target === 'midi') {
                    const mc = document.getElementById('midi-tester-container');
                    if (mc && mc.childElementCount === 0 && typeof MidiTester !== 'undefined') {
                        MidiTester.render('midi-tester-container');
                    }
                }
            });
        });
    }

    // ── MIDI / Mic toggles ─────────────────────────────────────────
    function _initInputToggles() {
        let midiOn = false, micOn = false;

        document.querySelectorAll('[id="midi-toggle-btn"]').forEach(btn => {
            btn.addEventListener('click', async () => {
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
                document.querySelectorAll('[id="midi-toggle-btn"]').forEach(b =>
                    b.classList.toggle('active', midiOn)
                );
            });
        });

        document.querySelectorAll('[id="mic-toggle-btn"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                micOn = !micOn;
                if (micOn) {
                    const ok = await InputRouter.enableMic();
                    micOn = ok;
                    if (!ok) { micOn = false; alert('Không thể truy cập microphone.'); }
                } else {
                    InputRouter.disableMic();
                }
                document.querySelectorAll('[id="mic-toggle-btn"]').forEach(b =>
                    b.classList.toggle('active', micOn)
                );
            });
        });
    }

    // ── Metronome toggle ───────────────────────────────────────────
    function _initMetronome() {
        const bar = document.getElementById('metronome-bar');
        let bpm = 80;

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
                bar?.classList.add('hidden');
                btn?.classList.remove('active');
            } else {
                Metronome.start(bpm);
                bar?.classList.remove('hidden');
                btn?.classList.add('active');
            }
        });

        Metronome.onBeat((beatIdx) => {
            const beat = document.getElementById(`mb${beatIdx}`);
            if (!beat) return;
            beat.classList.add('down');
            setTimeout(() => beat.classList.remove('down'), 120);
        });
    }

    // ── Bottom nav ─────────────────────────────────────────────────
    // NOTE: Router.onNavigate is called ONCE here. Do NOT call it elsewhere.
    function _initNav() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view === 'learn') {
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

        // SINGLE onNavigate handler — handles all view transitions
        Router.onNavigate((view, prev) => {
            // Cleanup when leaving learn
            if (prev === 'learn') {
                FallingNotes.stop();
                NoteHighlighter.clearTarget();
            }

            // Render on-demand
            if (view === 'home')    setTimeout(() => HomeView.render(), 20);
            if (view === 'profile') setTimeout(() => ProfileView.render(), 20);

            // Re-render piano when navigating to practice (canvas sizing fix)
            if (view === 'practice') {
                setTimeout(() => _renderPiano(_currentPianoLayout), 60);
            }
        });
    }

    // ── Piano (practice view) ──────────────────────────────────────
    function _initPiano() {
        _currentPianoLayout = localStorage.getItem('piano-layout') || '36';
        const savedTheme    = localStorage.getItem('piano-theme')  || 'classic';

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

        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === _currentPianoLayout);
            btn.addEventListener('click', () => {
                _currentPianoLayout = btn.dataset.layout;
                localStorage.setItem('piano-layout', _currentPianoLayout);
                document.querySelectorAll('.layout-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.layout === _currentPianoLayout)
                );
                _renderPiano(_currentPianoLayout);
            });
        });

        // Render piano — if practice view is hidden, canvas will be 0-width
        // The onNavigate handler will re-render when user opens practice view
        _renderPiano(_currentPianoLayout);
    }

    function _renderPiano(layout) {
        const container = document.getElementById('keyboard');
        if (!container) return;
        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render('keyboard', layout);
        Visualizer.init(canvas, noteMap);
    }

    // ── InputRouter wiring ─────────────────────────────────────────
    function _initInputRouter() {
        InputRouter.attachKeyboard();

        InputRouter.onNoteOn(midi => {
            AudioEngine.startNote(midi, midi);
            Visualizer.noteOn(midi);
            NoteHighlighter.noteOn(midi);
            FallingNotes.noteOn(midi);
            LessonEngine.noteOn(midi);
            MidiTester?.noteOn?.(midi, 80, 0);

            // Combo system: fire if note is in current target
            if (typeof ComboSystem !== 'undefined' && typeof NoteHighlighter !== 'undefined') {
                const target = NoteHighlighter.getTarget();
                if (target.size > 0 && target.has(midi)) {
                    ComboSystem.noteCorrect();
                } else if (target.size > 0) {
                    ComboSystem.noteWrong();
                }
            }
        });

        InputRouter.onNoteOff(midi => {
            AudioEngine.stopNote(midi);
            Visualizer.noteOff(midi);
            NoteHighlighter.noteOff(midi);
            FallingNotes.noteOff(midi);
            LessonEngine.noteOff(midi);
            MidiTester?.noteOff?.(midi);
        });

        // ChordPlayer highlight sync
        let chordVisNotes = new Set();
        ChordPlayer.onNotesChangeHandler(midiNotes => {
            if (typeof ChordUI !== 'undefined') ChordUI.updateKeyboardHighlight(midiNotes);
            const next = new Set(midiNotes);
            chordVisNotes.forEach(m => { if (!next.has(m)) Visualizer.noteOff(m); });
            midiNotes.forEach(m => { if (!chordVisNotes.has(m)) Visualizer.noteOn(m); });
            chordVisNotes = next;
        });
    }

    // ── Register Router views ──────────────────────────────────────
    function _registerViews() {
        Router.registerView('home',    () => HomeView.render());
        Router.registerView('learn',   () => LearnView.showList());
        Router.registerView('profile', () => ProfileView.render());
        Router.registerView('practice', () => {
            // Lazy init of chord system and songs
            try { SongUI.init(); } catch(e) { }
            try { ProgressionPlayer.init(); } catch(e) { }
            const songsContainer = document.getElementById('chord-tab-song');
            if (songsContainer && typeof SongsView !== 'undefined') {
                songsContainer.id = 'songs-view-container';
                SongsView.render('songs-view-container');
            }
        });
    }

    // ── Boot ───────────────────────────────────────────────────────
    function boot() {
        updateStats();
        _initNav();         // ← sets Router.onNavigate (MUST be before anything that calls Router.go)
        _initPracticeTabs();
        _initInputToggles();
        _initMetronome();
        _initPiano();
        _initInputRouter();
        _registerViews();
        LearnView.init();

        // Start adaptive session tracking
        if (typeof AdaptiveEngine !== 'undefined') {
            AdaptiveEngine.startSession();
        }

        if (Onboarding.shouldShow()) {
            Onboarding.show();
        } else {
            Router.restore();
        }
    }

    return { boot, updateStats };
})();
