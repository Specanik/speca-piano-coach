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
    let _resizeTimer        = null;

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

        function _showTab(target) {
            Object.entries(tabMap).forEach(([k, el]) => {
                if (!el) return;
                // Single source of truth: data-tab-active attribute drives CSS display.
                // CSS rule: [data-tab-active="false"] { display: none !important; }
                el.dataset.tabActive = String(k === target);
            });
        }

        // Initial state
        _showTab('piano');

        document.querySelectorAll('.practice-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.ptab;
                document.querySelectorAll('.practice-tab').forEach(b =>
                    b.classList.toggle('active', b.dataset.ptab === target)
                );
                _showTab(target);

                // Lazy init on first visit
                if (target === 'chords') {
                    try { ChordUI.init(); } catch(e) { console.warn('ChordUI:', e); }
                }
                if (target === 'midi') {
                    const mc = document.getElementById('midi-tester-container');
                    if (mc && mc.childElementCount === 0 && typeof MidiTester !== 'undefined') {
                        MidiTester.render('midi-tester-container');
                    }
                    // Auto-attempt MIDI connection when tester tab is opened
                    if (!InputRouter.getState().midi) {
                        InputRouter.enableMidi().catch(() => {});
                    }
                }
            });
        });
    }

    // ── MIDI / Mic toggles ─────────────────────────────────────────
    function _initInputToggles() {
        let midiOn = false, micOn = false;

        // Sustain indicator pill (shows "🦶 Pedal" when CC64 held)
        InputRouter.onStateChange(st => {
            const pill = document.getElementById('stat-sustain');
            if (pill) {
                pill.classList.toggle('hidden', !st.sustainOn);
            }
        });

        // Use class selector — IDs must be unique; multiple buttons use a class.
        document.querySelectorAll('.midi-toggle-btn').forEach(btn => {
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
                document.querySelectorAll('.midi-toggle-btn').forEach(b =>
                    b.classList.toggle('active', midiOn)
                );
            });
        });

        document.querySelectorAll('.mic-toggle-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                micOn = !micOn;
                if (micOn) {
                    const ok = await InputRouter.enableMic();
                    micOn = ok;
                    if (!ok) { micOn = false; alert('Không thể truy cập microphone.'); }
                } else {
                    InputRouter.disableMic();
                }
                document.querySelectorAll('.mic-toggle-btn').forEach(b =>
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

        // CSS handles the flash duration via animation; we just toggle the class.
        // Adding 'down' starts the animation; removing it on animationend is clean.
        Metronome.onBeat((beatIdx) => {
            const beat = document.getElementById(`mb${beatIdx}`);
            if (!beat) return;
            beat.classList.remove('down');
            // Force reflow so re-adding class restarts the animation
            void beat.offsetWidth;
            beat.classList.add('down');
        });
        document.addEventListener('animationend', e => {
            if (e.target.classList?.contains('metro-beat')) {
                e.target.classList.remove('down');
            }
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
                    requestAnimationFrame(() => LearnView.showList());
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
            // Cleanup when leaving freeplay
            if (prev === 'freeplay') {
                FreePlayView?.hide?.();
            }

            // Render on next animation frame — view is visible by then so
            // canvas dimensions are correct (eliminates 0-width race condition).
            if (view === 'home')     requestAnimationFrame(() => HomeView.render());
            if (view === 'profile')  requestAnimationFrame(() => ProfileView.render());
            if (view === 'practice') requestAnimationFrame(() => _renderPiano(_currentPianoLayout));
            if (view === 'freeplay') requestAnimationFrame(() => FreePlayView?.show?.());
        });
    }

    // ── Voice selector ─────────────────────────────────────────────
    function _initVoiceSelector() {
        const container = document.getElementById('voice-switcher');
        if (!container) return;

        function _dot(status) {
            if (status === 'loading') return '<span class="vbtn-dot loading"></span>';
            if (status === 'partial') return '<span class="vbtn-dot partial"></span>';
            if (status === 'ready')   return '<span class="vbtn-dot ready"></span>';
            return '';
        }

        function _render() {
            const voices   = AudioEngine.getVoices();
            const activeId = AudioEngine.getVoice();

            // Group by category
            const groups = {};
            voices.forEach(v => {
                if (!groups[v.cat]) groups[v.cat] = [];
                groups[v.cat].push(v);
            });

            container.innerHTML = Object.entries(groups).map(([cat, vs]) => `
                <div class="voice-group">
                    <span class="voice-group-label">${cat}</span>
                    <div class="voice-group-btns">
                        ${vs.map(v => `
                        <button class="voice-btn ${v.id === activeId ? 'active' : ''}"
                            data-voice="${v.id}" title="${v.description}">
                            ${v.label}${_dot(v.status)}
                        </button>`).join('')}
                    </div>
                </div>`).join('');

            container.querySelectorAll('.voice-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    AudioEngine.setVoice(btn.dataset.voice);
                    _render();
                });
            });
        }

        _render();
        AudioEngine.onVoiceChange(() => _render());
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

        InputRouter.onNoteOn((midi, velocity = 80) => {
            // Apply master volume as velocity scale; read transpose offset
            const S         = window.SettingsPanel;
            const volScale  = S ? S.get('masterVolume') / 100 : 0.85;
            const transpose = S ? (S.get('midiTranspose') || 0) : 0;
            const v = Math.max(1, Math.min(127, Math.round(velocity * volScale)));
            const m = transpose ? Math.max(0, Math.min(127, midi + transpose)) : midi;

            AudioEngine.startNote(m, m, v);
            Visualizer.noteOn(m);
            NoteHighlighter.noteOn(m);
            FallingNotes.noteOn(m);
            LessonEngine.noteOn(m);
            FreePlayView?.noteOn?.(m);
            MidiTester?.noteOn?.(m, v, 0);

            if (typeof ComboSystem !== 'undefined') {
                const target = NoteHighlighter.getTarget();
                if (target.size > 0 && target.has(m)) ComboSystem.noteCorrect();
                else if (target.size > 0)              ComboSystem.noteWrong();
            }
        });

        InputRouter.onNoteOff(midi => {
            const transpose = window.SettingsPanel?.get('midiTranspose') ?? 0;
            const m = transpose ? Math.max(0, Math.min(127, midi + transpose)) : midi;
            AudioEngine.stopNote(m);   // sustain logic handled inside AudioEngine
            Visualizer.noteOff(m);
            NoteHighlighter.noteOff(m);
            FallingNotes.noteOff(m);
            LessonEngine.noteOff(m);
            FreePlayView?.noteOff?.(m);
            MidiTester?.noteOff?.(m);
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
        Router.registerView('home',     () => HomeView.render());
        Router.registerView('learn',    () => LearnView.showList());
        Router.registerView('profile',  () => ProfileView.render());
        Router.registerView('freeplay', () => FreePlayView?.show?.());
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
        // Pre-warm AudioContext on first pointer interaction to eliminate
        // init latency on first MIDI note (browsers require user gesture).
        document.addEventListener('pointerdown', () => AudioEngine.prewarm(), { once: true });

        updateStats();
        _initNav();         // ← sets Router.onNavigate (MUST be before anything that calls Router.go)
        _initPracticeTabs();
        _initInputToggles();
        _initMetronome();
        _initVoiceSelector();
        _initPiano();
        _initInputRouter();
        _registerViews();
        _initResizeHandler();
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

    // ── Window resize → re-render practice piano ───────────────────
    function _initResizeHandler() {
        const debounceMs = window.PianoConfig?.ui?.resizeDebounceMs ?? 150;
        window.addEventListener('resize', () => {
            clearTimeout(_resizeTimer);
            _resizeTimer = setTimeout(() => {
                const practiceEl = document.querySelector('[data-view="practice"]');
                if (practiceEl?.classList.contains('view-active')) {
                    _renderPiano(_currentPianoLayout);
                }
            }, debounceMs);
        });
    }

    return { boot, updateStats };
})();
