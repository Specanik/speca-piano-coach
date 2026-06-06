/**
 * FreePlayView — Chế độ chơi tự do.
 * Full-screen piano sandbox: chord detection, MIDI, metronome, recording.
 */
const FreePlayView = (() => {

    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    let _bpm         = 80;
    let _metroOn     = false;
    let _metroId     = null;
    let _beat        = 0;
    let _beatsPerBar = 4;
    let _layout      = '36';
    let _pressedNotes = new Set();

    // Recording
    let _recording      = false;
    let _recordStart    = 0;
    let _recordedEvents = [];
    let _playbackId     = null;

    // ── Show ─────────────────────────────────────────────────────────
    function show() {
        const el = document.getElementById('freeplay-view');
        if (!el) return;

        _layout = window.SettingsPanel?.get('pianoLayout') ?? '36';

        el.innerHTML = _buildHTML();
        _mountPiano();
        _initStageCanvas();
        _bindEvents(el);
        _updateChordDisplay([]);
    }

    // ── HTML template ─────────────────────────────────────────────────
    function _buildHTML() {
        const voices = (typeof AudioEngine !== 'undefined')
            ? AudioEngine.getVoices() : [];
        const currentVoice = (typeof AudioEngine !== 'undefined')
            ? AudioEngine.getVoice() : '';

        return `
        <div class="fp-view">

            <!-- Header -->
            <div class="fp-header">
                <span class="fp-header-title">🎹 Chơi tự do</span>

                <!-- MIDI connect -->
                <button class="fp-header-btn" id="fp-midi-btn">
                    <span id="fp-midi-dot" style="width:6px;height:6px;border-radius:50%;background:#555;display:inline-block"></span>
                    MIDI
                </button>

                <!-- Record -->
                <button class="fp-header-btn fp-record-btn" id="fp-record-btn">
                    <span class="fp-record-dot"></span>
                    REC
                </button>
            </div>

            <!-- Chord display -->
            <div class="fp-chord-bar" id="fp-chord-bar">
                <div class="fp-chord-name" id="fp-chord-name">—</div>
                <div class="fp-chord-formula" id="fp-chord-formula"></div>
                <div id="fp-notes-played" class="fp-notes-played"></div>
                <div class="fp-chord-empty" id="fp-chord-empty">Nhấn phím để bắt đầu...</div>
            </div>

            <!-- Recording playback bar -->
            <div class="fp-playback-bar" id="fp-playback-bar">
                <span class="fp-record-dot"></span>
                <span class="fp-playback-info" id="fp-playback-info">Đã ghi âm</span>
                <button class="fp-header-btn" id="fp-play-rec-btn">▶ Phát lại</button>
                <button class="fp-header-btn" id="fp-clear-rec-btn">✕ Xóa</button>
            </div>

            <!-- Beat indicator (metronome) -->
            <div class="fp-beat-indicator hidden" id="fp-beat-indicator">
                ${Array.from({length:4}, (_,i) => `<div class="fp-beat-light" id="fp-beat-${i}"></div>`).join('')}
            </div>

            <!-- Controls strip -->
            <div class="fp-controls">

                <!-- Sound -->
                <span class="fp-ctrl-label">Âm</span>
                <select class="fp-voice-select" id="fp-voice-sel">
                    ${voices.map(v =>
                        `<option value="${v.id}"${v.id === currentVoice ? ' selected' : ''}>${v.label}</option>`
                    ).join('')}
                </select>

                <div class="fp-ctrl-sep"></div>

                <!-- Keys count -->
                <span class="fp-ctrl-label">Phím</span>
                <div class="fp-ctrl-group" id="fp-layout-group">
                    ${['36','61','88'].map(k =>
                        `<button class="fp-ctrl-btn${k === _layout ? ' active' : ''}" data-layout="${k}">${k}</button>`
                    ).join('')}
                </div>

                <div class="fp-ctrl-sep"></div>

                <!-- Metronome -->
                <button class="fp-ctrl-btn${_metroOn ? ' active' : ''}" id="fp-metro-btn">♩ Metro</button>
                <div class="fp-bpm-group" id="fp-bpm-group">
                    <button class="fp-bpm-btn" id="fp-bpm-dn">−</button>
                    <span class="fp-bpm-display" id="fp-bpm-val">${_bpm}</span>
                    <button class="fp-bpm-btn" id="fp-bpm-up">+</button>
                </div>

                <div class="fp-ctrl-sep"></div>

                <!-- Octave shift -->
                <span class="fp-ctrl-label">Oct</span>
                <div class="fp-bpm-group">
                    <button class="fp-bpm-btn" id="fp-oct-dn">−</button>
                    <span class="fp-bpm-display" id="fp-oct-val">0</span>
                    <button class="fp-bpm-btn" id="fp-oct-up">+</button>
                </div>

            </div>

            <!-- Stage / note ripple visualizer -->
            <div class="fp-middle" id="fp-middle">
                <canvas class="fp-stage-canvas" id="fp-stage-canvas"></canvas>
                <div class="fp-stage-hint" id="fp-stage-hint">
                    <div class="fp-stage-hint-icon">🎹</div>
                    <div class="fp-stage-hint-text">Chơi tự do — mọi nốt đều được phát âm</div>
                </div>
            </div>

            <!-- Piano area -->
            <div class="fp-piano-area" id="fp-piano-area"></div>

        </div>`;
    }

    // ── Mount piano ───────────────────────────────────────────────────
    function _mountPiano() {
        const container = document.getElementById('fp-piano-area');
        if (!container || typeof Keyboard === 'undefined') return;

        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render('fp-piano-area', _layout);
        Visualizer.init(canvas, noteMap);
    }

    // ── Stage canvas ripple visualizer ───────────────────────────────
    let _ripples = [];
    let _rafId   = null;

    const NOTE_COLORS = [
        '#4a9eff','#00d4aa','#a78bfa','#fb923c','#f472b6',
        '#34d399','#fbbf24','#60a5fa','#f87171','#38bdf8','#a3e635','#e879f9'
    ];

    function _initStageCanvas() {
        const canvas = document.getElementById('fp-stage-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        _ripples = [];

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width  = rect.width  || 600;
            canvas.height = rect.height || 200;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas.parentElement);
        canvas._ro = ro;

        const draw = () => {
            _rafId = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            _ripples = _ripples.filter(r => r.alpha > 0.01);
            for (const r of _ripples) {
                r.radius += r.speed;
                r.alpha  *= 0.94;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = r.color + Math.round(r.alpha * 255).toString(16).padStart(2,'0');
                ctx.lineWidth = 2;
                ctx.stroke();
                // inner fill dot
                if (r.radius < 30) {
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, Math.max(0, 12 - r.radius * 0.4), 0, Math.PI * 2);
                    ctx.fillStyle = r.color + Math.round(r.alpha * 0.6 * 255).toString(16).padStart(2,'0');
                    ctx.fill();
                }
            }
        };
        draw();
    }

    function _destroyStageCanvas() {
        if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
        const canvas = document.getElementById('fp-stage-canvas');
        if (canvas?._ro) { canvas._ro.disconnect(); canvas._ro = null; }
        _ripples = [];
    }

    function _spawnRipple(midi) {
        const canvas = document.getElementById('fp-stage-canvas');
        if (!canvas) return;
        const w = canvas.width;
        const h = canvas.height;
        // X spread across canvas based on midi pitch (21-108)
        const t = Math.max(0, Math.min(1, (midi - 21) / 87));
        const x = 20 + t * (w - 40) + (Math.random() - 0.5) * 30;
        const y = h * 0.4 + (Math.random() - 0.5) * h * 0.35;
        _ripples.push({
            x, y,
            radius: 4,
            speed: 1.8 + Math.random() * 1.2,
            alpha: 0.85,
            color: NOTE_COLORS[midi % 12]
        });
        // Hide hint on first play
        const hint = document.getElementById('fp-stage-hint');
        if (hint && !hint.classList.contains('hidden')) hint.classList.add('hidden');
    }

    // ── Bind events ───────────────────────────────────────────────────
    function _bindEvents(el) {
        // MIDI toggle
        el.querySelector('#fp-midi-btn')?.addEventListener('click', async () => {
            if (typeof InputRouter === 'undefined') return;
            const st = InputRouter.getState();
            if (st.midi) {
                InputRouter.disableMidi();
            } else {
                if (!navigator.requestMIDIAccess) {
                    alert('Trình duyệt không hỗ trợ Web MIDI. Dùng Chrome hoặc Edge.');
                    return;
                }
                await InputRouter.enableMidi();
            }
            _updateMidiDot();
        });

        // Voice select
        el.querySelector('#fp-voice-sel')?.addEventListener('change', e => {
            AudioEngine.setVoice(e.target.value);
        });

        // Layout switcher
        el.querySelector('#fp-layout-group')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-layout]');
            if (!btn) return;
            _layout = btn.dataset.layout;
            el.querySelectorAll('#fp-layout-group .fp-ctrl-btn')
                .forEach(b => b.classList.toggle('active', b === btn));
            _mountPiano();
        });

        // Metronome
        el.querySelector('#fp-metro-btn')?.addEventListener('click', e => {
            _metroOn = !_metroOn;
            e.currentTarget.classList.toggle('active', _metroOn);
            const ind = document.getElementById('fp-beat-indicator');
            if (ind) ind.classList.toggle('hidden', !_metroOn);
            if (_metroOn) _startMetronome();
            else _stopMetronome();
        });

        // BPM
        el.querySelector('#fp-bpm-dn')?.addEventListener('click', () => _adjustBpm(-5));
        el.querySelector('#fp-bpm-up')?.addEventListener('click', () => _adjustBpm(5));

        // Octave shift
        let _octShift = 0;
        el.querySelector('#fp-oct-dn')?.addEventListener('click', () => {
            _octShift = Math.max(-3, _octShift - 1);
            const disp = document.getElementById('fp-oct-val');
            if (disp) disp.textContent = _octShift >= 0 ? `+${_octShift}` : String(_octShift);
            if (window.SettingsPanel) {
                SettingsPanel.set('midiTranspose', _octShift * 12);
            }
        });
        el.querySelector('#fp-oct-up')?.addEventListener('click', () => {
            _octShift = Math.min(3, _octShift + 1);
            const disp = document.getElementById('fp-oct-val');
            if (disp) disp.textContent = _octShift >= 0 ? `+${_octShift}` : String(_octShift);
            if (window.SettingsPanel) {
                SettingsPanel.set('midiTranspose', _octShift * 12);
            }
        });

        // Record
        el.querySelector('#fp-record-btn')?.addEventListener('click', () => {
            if (_recording) _stopRecording();
            else _startRecording();
        });

        el.querySelector('#fp-play-rec-btn')?.addEventListener('click', () => {
            _playRecording();
        });

        el.querySelector('#fp-clear-rec-btn')?.addEventListener('click', () => {
            _recordedEvents = [];
            const bar = document.getElementById('fp-playback-bar');
            if (bar) bar.classList.remove('visible');
        });

        _updateMidiDot();
    }

    // ── Chord pattern table (longer/more-specific first) ─────────────
    // intervals: semitones from root, always includes 0
    const CHORD_PATTERNS = [
        // ── 5-note ──────────────────────────────────────────────────
        { intervals:[0,2,4,7,10], suffix:'9',      formula:'1–2–3–5–♭7'   },
        { intervals:[0,2,4,7,11], suffix:'maj9',   formula:'1–2–3–5–7'    },
        { intervals:[0,2,3,7,10], suffix:'m9',     formula:'1–2–♭3–5–♭7'  },
        { intervals:[0,2,5,7,10], suffix:'11',     formula:'1–2–4–5–♭7'   },
        { intervals:[0,4,7,9,14], suffix:'6/9',    formula:'1–3–5–6–9'    }, // 14%12=2 handled
        // ── 4-note ──────────────────────────────────────────────────
        { intervals:[0,3,6,9],   suffix:'dim7',   formula:'1–♭3–♭5–♭♭7'  },
        { intervals:[0,4,7,11],  suffix:'maj7',   formula:'1–3–5–7'       },
        { intervals:[0,3,7,11],  suffix:'mMaj7',  formula:'1–♭3–5–7'      },
        { intervals:[0,3,7,10],  suffix:'m7',     formula:'1–♭3–5–♭7'     },
        { intervals:[0,4,7,10],  suffix:'7',      formula:'1–3–5–♭7'      },
        { intervals:[0,3,6,10],  suffix:'m7♭5',   formula:'1–♭3–♭5–♭7'    },
        { intervals:[0,4,8,10],  suffix:'aug7',   formula:'1–3–♯5–♭7'     },
        { intervals:[0,4,7,9],   suffix:'6',      formula:'1–3–5–6'       },
        { intervals:[0,3,7,9],   suffix:'m6',     formula:'1–♭3–5–6'      },
        { intervals:[0,2,4,7],   suffix:'add9',   formula:'1–2–3–5'       },
        { intervals:[0,3,5,7],   suffix:'sus4add9',formula:'1–♭3–4–5'     },
        { intervals:[0,2,5,7],   suffix:'sus2sus4',formula:'1–2–4–5'      },
        // ── 3-note ──────────────────────────────────────────────────
        { intervals:[0,2,7],     suffix:'sus2',   formula:'1–2–5'         },
        { intervals:[0,5,7],     suffix:'sus4',   formula:'1–4–5'         },
        { intervals:[0,3,6],     suffix:'dim',    formula:'1–♭3–♭5'       },
        { intervals:[0,4,8],     suffix:'aug',    formula:'1–3–♯5'        },
        { intervals:[0,4,7],     suffix:'',       formula:'1–3–5'         },
        { intervals:[0,3,7],     suffix:'m',      formula:'1–♭3–5'        },
        { intervals:[0,1,7],     suffix:'♭9',     formula:'1–♭2–5'        },
        // ── 2-note (dyads) ───────────────────────────────────────────
        { intervals:[0,7],       suffix:'5',      formula:'1–5'           },
        { intervals:[0,5],       suffix:'sus',    formula:'1–4'           },
        { intervals:[0,4],       suffix:'(3)',    formula:'1–3'           },
        { intervals:[0,3],       suffix:'m(3)',   formula:'1–♭3'          },
        { intervals:[0,6],       suffix:'♭5',     formula:'1–♭5'          },
    ];

    function _detectChord(midiNotes) {
        if (midiNotes.length < 2) return null;

        // Unique pitch classes mod 12
        const pcs = [...new Set(midiNotes.map(m => m % 12))].sort((a, b) => a - b);
        if (pcs.length < 2) return null;

        // Bass note = lowest MIDI note
        const bassMidi = Math.min(...midiNotes);
        const bassPc   = bassMidi % 12;

        let best = null;
        let bestScore = -1;

        for (const rootPc of pcs) {
            const intervals = pcs.map(pc => (pc - rootPc + 12) % 12).sort((a, b) => a - b);

            for (const pat of CHORD_PATTERNS) {
                if (!pat.intervals.every(i => intervals.includes(i))) continue;

                // Score: pattern length × 10, exact note count match +5, root=bass +3
                const score = pat.intervals.length * 10
                    + (pcs.length === pat.intervals.length ? 5 : 0)
                    + (rootPc === bassPc ? 3 : 0);

                if (score > bestScore) {
                    bestScore = score;
                    // Slash chord: show bass if bass ≠ root (inversion)
                    const rootName = NOTE_NAMES[rootPc];
                    const bassName = NOTE_NAMES[bassPc];
                    const slash    = (rootPc !== bassPc) ? '/' + bassName : '';
                    best = {
                        root:    rootName,
                        suffix:  pat.suffix,
                        slash,
                        formula: pat.formula,
                    };
                }
            }
        }
        return best;
    }

    // ── Chord / note display ──────────────────────────────────────────
    function _updateChordDisplay(notes) {
        const nameEl    = document.getElementById('fp-chord-name');
        const formulaEl = document.getElementById('fp-chord-formula');
        const chipsEl   = document.getElementById('fp-notes-played');
        const emptyEl   = document.getElementById('fp-chord-empty');
        if (!nameEl) return;

        if (notes.length === 0) {
            nameEl.textContent    = '—';
            formulaEl.textContent = '';
            if (chipsEl) chipsEl.innerHTML = '';
            if (emptyEl) emptyEl.style.display = '';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';

        // Note chips — sorted ascending by pitch
        if (chipsEl) {
            chipsEl.innerHTML = [...notes].sort((a, b) => a - b).map(m => {
                const name = NOTE_NAMES[m % 12] + Math.floor(m / 12 - 1);
                return `<div class="fp-note-chip">${name}</div>`;
            }).join('');
        }

        // Single note
        if (notes.length === 1) {
            nameEl.textContent    = NOTE_NAMES[[...notes][0] % 12];
            formulaEl.textContent = '';
            nameEl.classList.remove('sp-correct');
            return;
        }

        // Multi-note: detect chord
        const chord = _detectChord([...notes]);
        if (chord) {
            // "Cm/G" or "C" — slash shown in smaller text
            const slash = chord.slash
                ? `<span style="font-size:0.55em;opacity:0.7">${chord.slash}</span>`
                : '';
            nameEl.innerHTML      = chord.root + chord.suffix + slash;
            formulaEl.textContent = chord.formula + (chord.slash ? `  (thế ${_inversionLabel(chord.slash)})` : '');
            nameEl.classList.add('sp-correct');
        } else {
            const pcs = [...new Set([...notes].map(m => m % 12))];
            nameEl.textContent    = pcs.map(pc => NOTE_NAMES[pc]).join('+');
            formulaEl.textContent = 'hợp âm không xác định';
            nameEl.classList.remove('sp-correct');
        }
    }

    function _inversionLabel(slash) {
        // slash is "/X" — just return the bass note
        return slash.slice(1);
    }

    // ── NoteOn / NoteOff hooks (called by AppShell's InputRouter) ─────
    function noteOn(midi) {
        _pressedNotes.add(midi);
        _spawnRipple(midi);
        _updateChordDisplay([..._pressedNotes]);
        if (_recording) {
            _recordedEvents.push({ type: 'on', midi, t: performance.now() - _recordStart });
        }
    }

    function noteOff(midi) {
        _pressedNotes.delete(midi);
        _updateChordDisplay([..._pressedNotes]);
        if (_recording) {
            _recordedEvents.push({ type: 'off', midi, t: performance.now() - _recordStart });
        }
    }

    // ── Metronome ─────────────────────────────────────────────────────
    function _startMetronome() {
        _stopMetronome();
        _beat = 0;
        const beatMs = Math.round(60000 / _bpm);

        const tick = () => {
            _flashBeat(_beat % _beatsPerBar);
            // Simple click sound via AudioEngine (if available)
            if (typeof AudioEngine !== 'undefined') {
                const pitch = _beat % _beatsPerBar === 0 ? 76 : 64;
                AudioEngine.startNote(pitch, pitch, _beat % _beatsPerBar === 0 ? 80 : 55);
                setTimeout(() => AudioEngine.stopNote(pitch), 60);
            }
            _beat++;
            _metroId = setTimeout(tick, beatMs);
        };
        tick();
    }

    function _stopMetronome() {
        if (_metroId) { clearTimeout(_metroId); _metroId = null; }
        _beat = 0;
        document.querySelectorAll('.fp-beat-light').forEach(el => {
            el.className = 'fp-beat-light';
        });
    }

    function _flashBeat(beat) {
        document.querySelectorAll('.fp-beat-light').forEach((el, i) => {
            el.className = 'fp-beat-light' + (i === beat ? (beat === 0 ? ' beat-1' : ' beat-n') : '');
        });
    }

    function _adjustBpm(delta) {
        _bpm = Math.max(40, Math.min(240, _bpm + delta));
        const disp = document.getElementById('fp-bpm-val');
        if (disp) disp.textContent = _bpm;
        if (_metroOn) _startMetronome();
    }

    // ── Recording ─────────────────────────────────────────────────────
    function _startRecording() {
        _recordedEvents = [];
        _recordStart    = performance.now();
        _recording      = true;
        const btn = document.getElementById('fp-record-btn');
        if (btn) btn.classList.add('recording');
    }

    function _stopRecording() {
        _recording = false;
        const btn = document.getElementById('fp-record-btn');
        if (btn) btn.classList.remove('recording');

        if (_recordedEvents.length > 0) {
            const durationMs = _recordedEvents[_recordedEvents.length - 1].t;
            const bar = document.getElementById('fp-playback-bar');
            const info = document.getElementById('fp-playback-info');
            if (bar) bar.classList.add('visible');
            if (info) {
                const secs = Math.round(durationMs / 1000);
                info.textContent = `Đã ghi ${_recordedEvents.length / 2 | 0} nốt (${secs}s)`;
            }
        }
    }

    function _playRecording() {
        if (_playbackId) clearTimeout(_playbackId);
        if (_recordedEvents.length === 0) return;

        _recordedEvents.forEach(ev => {
            _playbackId = setTimeout(() => {
                if (ev.type === 'on') {
                    AudioEngine.startNote(ev.midi, ev.midi, 80);
                    Visualizer.noteOn(ev.midi);
                } else {
                    AudioEngine.stopNote(ev.midi);
                    Visualizer.noteOff(ev.midi);
                }
            }, ev.t);
        });
    }

    // ── MIDI dot update ───────────────────────────────────────────────
    function _updateMidiDot() {
        const dot = document.getElementById('fp-midi-dot');
        if (!dot || typeof InputRouter === 'undefined') return;
        const st = InputRouter.getState();
        const on = st.midi && st.midiDevices?.length;
        dot.style.background = on ? '#50c878' : '#555';
    }

    // ── Cleanup on leave ──────────────────────────────────────────────
    function hide() {
        _stopMetronome();
        _destroyStageCanvas();
        if (_playbackId) clearTimeout(_playbackId);
        _recording      = false;
        _pressedNotes.clear();
    }

    return { show, hide, noteOn, noteOff };
})();
