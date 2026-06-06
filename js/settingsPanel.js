/**
 * SettingsPanel — Gear icon always visible in top-bar.
 * Click → slide-in drawer with all app settings.
 * Replaces DevMode's floating badge; dev tools now live inside the panel.
 *
 * Settings persist to localStorage ('piano-settings-v1').
 * Legacy keys (piano-theme, piano-layout) stay in sync for backward compat.
 */
const SettingsPanel = (() => {
    const STORAGE_KEY = 'piano-settings-v1';

    const DEFAULTS = {
        masterVolume:      85,         // 0–100 %
        keyboardVelocity:  80,         // 40–127
        midiTranspose:     0,          // –12 to +12 semitones
        pianoTheme:        'classic',  // classic | grand | neon | minimal
        pianoLayout:       '36',       // '36' | '61' | '76' | '88'
        handSplitMidi:     60,         // MIDI boundary left/right hand
        fallingSpeedMult:  1.0,        // 0.5–2.0×
        defaultWaitMode:   false,
        metronomeBpm:      80,         // 40–240
        devMode:           false,
    };

    let _settings = {};
    let _open = false;

    // ── Persistence ────────────────────────────────────────────────────────
    function _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            _settings = Object.assign({}, DEFAULTS, raw ? JSON.parse(raw) : {});
            // Sync from legacy keys so practice-view controls stay authoritative
            const t = localStorage.getItem('piano-theme');
            const l = localStorage.getItem('piano-layout');
            if (t) _settings.pianoTheme  = t;
            if (l) _settings.pianoLayout = l;
        } catch {
            _settings = { ...DEFAULTS };
        }
    }

    function _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_settings));
    }

    function get(key) {
        return Object.prototype.hasOwnProperty.call(_settings, key) ? _settings[key] : DEFAULTS[key];
    }

    function set(key, value) {
        _settings[key] = value;
        _save();
        _applyOne(key, value);
    }

    // ── Apply one setting immediately ──────────────────────────────────────
    function _applyOne(key, value) {
        switch (key) {
            case 'pianoTheme':
                document.body.dataset.theme = value;
                localStorage.setItem('piano-theme', value);
                document.querySelectorAll('.theme-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.theme === value));
                break;

            case 'pianoLayout':
                localStorage.setItem('piano-layout', value);
                // Trigger existing layout button → re-renders piano
                const lb = document.querySelector(`.layout-btn[data-layout="${value}"]`);
                if (lb) lb.click();
                else document.querySelectorAll('.layout-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.layout === value));
                break;

            case 'handSplitMidi':
                FallingNotes?.setSplit?.(value);
                break;

            case 'fallingSpeedMult':
                FallingNotes?.setSpeedMult?.(value);
                break;

            case 'devMode':
                _updateDevSection();
                break;
        }
        // masterVolume, keyboardVelocity, midiTranspose: read live by appShell / inputRouter
        // defaultWaitMode, metronomeBpm: read on first use
    }

    function _applyAll() {
        _applyOne('pianoTheme',       _settings.pianoTheme);
        _applyOne('handSplitMidi',    _settings.handSplitMidi);
        _applyOne('fallingSpeedMult', _settings.fallingSpeedMult);
        _applyOne('devMode',          _settings.devMode);
        // pianoLayout: AppShell reads directly from localStorage
    }

    // ── Panel visibility ───────────────────────────────────────────────────
    function show() {
        if (_open) return;
        _syncFromLegacy();
        _open = true;
        document.getElementById('settings-overlay')?.classList.add('active');
        document.getElementById('settings-panel')?.classList.add('active');
        _refreshInputStatus();
    }

    function hide() {
        if (!_open) return;
        _open = false;
        document.getElementById('settings-overlay')?.classList.remove('active');
        document.getElementById('settings-panel')?.classList.remove('active');
    }

    function toggle() { _open ? hide() : show(); }

    // Sync settings that can be changed from practice view controls
    function _syncFromLegacy() {
        const t = localStorage.getItem('piano-theme');
        const l = localStorage.getItem('piano-layout');
        if (t && t !== _settings.pianoTheme) {
            _settings.pianoTheme = t;
            document.querySelectorAll('#sp-theme-seg .sp-seg-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.val === t));
        }
        if (l && l !== _settings.pianoLayout) {
            _settings.pianoLayout = l;
            document.querySelectorAll('#sp-layout-seg .sp-seg-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.val === l));
        }
    }

    // ── DOM construction ───────────────────────────────────────────────────
    function _renderOverlay() {
        const ov = document.createElement('div');
        ov.id = 'settings-overlay';
        ov.addEventListener('click', hide);
        document.body.appendChild(ov);
    }

    function _renderPanel() {
        const panel = document.createElement('div');
        panel.id = 'settings-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Cài đặt');
        panel.innerHTML = _buildHTML();
        document.body.appendChild(panel);
        _wireEvents();
    }

    function _buildHTML() {
        const s = _settings;
        const transpose = s.midiTranspose;
        const transposeLabel = (transpose > 0 ? '+' : '') + transpose;
        const volPct = s.masterVolume;
        const velPct = Math.round((s.keyboardVelocity - 40) / (127 - 40) * 100);
        const speedPct = Math.round((s.fallingSpeedMult - 0.5) / (2.0 - 0.5) * 100);

        return `
<div class="sp-header">
    <span class="sp-title">⚙ Cài đặt</span>
    <button class="sp-close" id="sp-close-btn" aria-label="Đóng">✕</button>
</div>
<div class="sp-body">

    <!-- 🔊 Audio -->
    <div class="sp-section">
        <div class="sp-section-title">🔊 Âm thanh</div>
        <div class="sp-row">
            <label class="sp-label">Âm lượng</label>
            <div class="sp-slider-wrap">
                <input type="range" class="sp-slider" id="sp-master-volume"
                    min="0" max="100" value="${volPct}"
                    style="--pct:${volPct}%">
                <span class="sp-slider-val" id="sp-master-volume-val">${volPct}%</span>
            </div>
        </div>
        <div class="sp-row">
            <label class="sp-label">Lực phím bàn phím</label>
            <div class="sp-slider-wrap">
                <input type="range" class="sp-slider" id="sp-kb-velocity"
                    min="40" max="127" value="${s.keyboardVelocity}"
                    style="--pct:${velPct}%">
                <span class="sp-slider-val" id="sp-kb-velocity-val">${s.keyboardVelocity}</span>
            </div>
        </div>
    </div>

    <!-- 🎹 Kết nối -->
    <div class="sp-section">
        <div class="sp-section-title">🎹 Kết nối & MIDI</div>
        <div class="sp-connect-row">
            <label class="sp-label">🎹 MIDI</label>
            <div class="sp-connect-right">
                <span class="sp-info-text" id="sp-midi-name">—</span>
                <span class="sp-dot" id="sp-dot-midi"></span>
                <button class="sp-btn sp-btn-sm" id="sp-midi-connect">Kết nối</button>
            </div>
        </div>
        <div class="sp-connect-row">
            <label class="sp-label">🎤 Microphone</label>
            <div class="sp-connect-right">
                <span class="sp-dot" id="sp-dot-mic"></span>
                <button class="sp-btn sp-btn-sm" id="sp-mic-connect">Kết nối</button>
            </div>
        </div>
        <div class="sp-row sp-row-between">
            <label class="sp-label">Dịch chuyển MIDI</label>
            <div class="sp-stepper">
                <button class="sp-step-btn" id="sp-transpose-dn">−</button>
                <span class="sp-step-val" id="sp-transpose-val">${transposeLabel}</span>
                <button class="sp-step-btn" id="sp-transpose-up">+</button>
            </div>
        </div>
    </div>

    <!-- 🎵 Bàn phím đàn -->
    <div class="sp-section">
        <div class="sp-section-title">🎵 Bàn phím đàn</div>
        <div class="sp-row sp-row-col">
            <label class="sp-label">Số phím</label>
            <div class="sp-seg" id="sp-layout-seg">
                ${['36','61','76','88'].map(n =>
                    `<button class="sp-seg-btn${s.pianoLayout === n ? ' active' : ''}" data-val="${n}">${n}</button>`
                ).join('')}
            </div>
        </div>
        <div class="sp-row sp-row-col">
            <label class="sp-label">Giao diện phím</label>
            <div class="sp-seg" id="sp-theme-seg">
                ${[['classic','Classic'],['grand','Grand'],['neon','Neon'],['minimal','Minimal']].map(([v,l]) =>
                    `<button class="sp-seg-btn${s.pianoTheme === v ? ' active' : ''}" data-val="${v}">${l}</button>`
                ).join('')}
            </div>
        </div>
        <div class="sp-row sp-row-between">
            <label class="sp-label">Điểm chia tay (MIDI nốt)</label>
            <div class="sp-stepper">
                <button class="sp-step-btn" id="sp-split-dn">−</button>
                <span class="sp-step-val" id="sp-split-val">${s.handSplitMidi}</span>
                <button class="sp-step-btn" id="sp-split-up">+</button>
            </div>
        </div>
    </div>

    <!-- 🎼 Luyện tập -->
    <div class="sp-section">
        <div class="sp-section-title">🎼 Luyện tập</div>
        <div class="sp-row">
            <label class="sp-label">Tốc độ nốt rơi</label>
            <div class="sp-slider-wrap">
                <input type="range" class="sp-slider" id="sp-fall-speed"
                    min="50" max="200" value="${Math.round(s.fallingSpeedMult * 100)}"
                    style="--pct:${speedPct}%">
                <span class="sp-slider-val" id="sp-fall-speed-val">${s.fallingSpeedMult.toFixed(1)}×</span>
            </div>
        </div>
        <div class="sp-row sp-row-between">
            <label class="sp-label">Chờ bấm đúng (Wait mode)</label>
            <button class="sp-toggle${s.defaultWaitMode ? ' on' : ''}" id="sp-wait-toggle"></button>
        </div>
        <div class="sp-row sp-row-between">
            <label class="sp-label">BPM mặc định (Metronome)</label>
            <div class="sp-stepper">
                <button class="sp-step-btn" id="sp-bpm-dn">−</button>
                <span class="sp-step-val" id="sp-bpm-val">${s.metronomeBpm}</span>
                <button class="sp-step-btn" id="sp-bpm-up">+</button>
            </div>
        </div>
    </div>

    <!-- 🔧 Dev Tools -->
    <div class="sp-section">
        <div class="sp-section-title-row">
            <span>🔧 Dev Tools</span>
            <button class="sp-toggle${s.devMode ? ' on' : ''}" id="sp-dev-toggle"></button>
        </div>
        <div id="sp-dev-tools" class="${s.devMode ? 'sp-dev-body' : 'sp-hidden'}">
            <div class="sp-dev-status">
                <div class="sp-dev-status-row">
                    <span>⌨️ Keyboard</span>
                    <span class="sp-dot on"></span>
                </div>
                <div class="sp-dev-status-row">
                    <span>🎹 MIDI</span>
                    <span class="sp-info-text" id="sp-dev-midi-name">—</span>
                    <span class="sp-dot" id="sp-dev-dot-midi"></span>
                </div>
                <div class="sp-dev-status-row">
                    <span>🎤 Mic</span>
                    <span class="sp-dot" id="sp-dev-dot-mic"></span>
                </div>
            </div>
            <button class="sp-btn sp-btn-warn sp-btn-block" id="sp-dev-unlock">🔓 Mở khóa tất cả bài học</button>
            <button class="sp-btn sp-btn-block" id="sp-dev-skip">⏭ Bỏ qua bước hiện tại</button>
            <div class="sp-dev-goto">
                <select class="sp-select" id="sp-dev-lesson-sel">
                    <option value="">— Chọn bài học —</option>
                </select>
                <button class="sp-btn" id="sp-dev-goto">▶</button>
            </div>
            <button class="sp-btn sp-btn-danger sp-btn-block" id="sp-dev-reset">🗑️ Reset tiến trình học</button>
            <div id="sp-dev-log" class="sp-dev-log">
                <span style="color:#2a4060;font-style:italic">Dev log...</span>
            </div>
        </div>
    </div>

    <div class="sp-footer-hint">Ctrl+Shift+, để mở/đóng nhanh</div>
</div>`;
    }

    // ── Dev section toggle ─────────────────────────────────────────────────
    function _updateDevSection() {
        const devTools = document.getElementById('sp-dev-tools');
        const toggle   = document.getElementById('sp-dev-toggle');
        const on = !!_settings.devMode;
        if (devTools) {
            devTools.className = on ? 'sp-dev-body' : 'sp-hidden';
        }
        if (toggle) toggle.classList.toggle('on', on);
    }

    // ── Wire all events ────────────────────────────────────────────────────
    function _wireEvents() {
        // Close
        document.getElementById('sp-close-btn')?.addEventListener('click', hide);

        // Escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && _open) hide();
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ',') {
                e.preventDefault();
                toggle();
            }
        });

        // ── Audio ──
        _wireSlider('sp-master-volume', 'sp-master-volume-val',
            v => `${v}%`, v => set('masterVolume', parseInt(v)));

        _wireSlider('sp-kb-velocity', 'sp-kb-velocity-val',
            v => String(v), v => set('keyboardVelocity', parseInt(v)));

        // ── MIDI connect ──
        document.getElementById('sp-midi-connect')?.addEventListener('click', async () => {
            const btn = document.getElementById('sp-midi-connect');
            const st = InputRouter?.getState?.();
            if (st?.midi) {
                InputRouter.disableMidi?.();
                _refreshInputStatus();
            } else {
                btn.textContent = '⏳';
                btn.disabled = true;
                const ok = await InputRouter?.enableMidi?.().catch(() => false);
                if (!ok) _devLog('❌ MIDI không thể kết nối');
                _refreshInputStatus();
                btn.disabled = false;
            }
        });

        // ── Mic connect ──
        document.getElementById('sp-mic-connect')?.addEventListener('click', async () => {
            const btn = document.getElementById('sp-mic-connect');
            const st = InputRouter?.getState?.();
            if (st?.mic) {
                InputRouter.disableMic?.();
                _refreshInputStatus();
            } else {
                btn.textContent = '⏳';
                btn.disabled = true;
                const ok = await InputRouter?.enableMic?.().catch(() => false);
                if (!ok) _devLog('❌ Mic không thể kết nối');
                _refreshInputStatus();
                btn.disabled = false;
            }
        });

        // ── MIDI transpose ──
        _wireStepper('sp-transpose-dn', 'sp-transpose-up', 'sp-transpose-val',
            'midiTranspose', -12, 12, 1,
            v => (v > 0 ? '+' : '') + v);

        // ── Piano layout segmented ──
        document.getElementById('sp-layout-seg')?.addEventListener('click', e => {
            const btn = e.target.closest('.sp-seg-btn');
            if (!btn) return;
            document.querySelectorAll('#sp-layout-seg .sp-seg-btn')
                .forEach(b => b.classList.toggle('active', b === btn));
            set('pianoLayout', btn.dataset.val);
        });

        // ── Piano theme segmented ──
        document.getElementById('sp-theme-seg')?.addEventListener('click', e => {
            const btn = e.target.closest('.sp-seg-btn');
            if (!btn) return;
            document.querySelectorAll('#sp-theme-seg .sp-seg-btn')
                .forEach(b => b.classList.toggle('active', b === btn));
            set('pianoTheme', btn.dataset.val);
        });

        // ── Hand split MIDI ──
        _wireStepper('sp-split-dn', 'sp-split-up', 'sp-split-val',
            'handSplitMidi', 36, 84, 1);

        // ── Falling speed ──
        const fallSlider = document.getElementById('sp-fall-speed');
        const fallVal    = document.getElementById('sp-fall-speed-val');
        fallSlider?.addEventListener('input', () => {
            const mult = parseInt(fallSlider.value) / 100;
            _updateSliderFill(fallSlider);
            if (fallVal) fallVal.textContent = mult.toFixed(1) + '×';
            set('fallingSpeedMult', mult);
        });

        // ── Wait mode toggle ──
        document.getElementById('sp-wait-toggle')?.addEventListener('click', e => {
            const next = !get('defaultWaitMode');
            e.currentTarget.classList.toggle('on', next);
            set('defaultWaitMode', next);
        });

        // ── Metronome BPM ──
        _wireStepper('sp-bpm-dn', 'sp-bpm-up', 'sp-bpm-val',
            'metronomeBpm', 40, 240, 5);

        // ── Dev mode toggle ──
        document.getElementById('sp-dev-toggle')?.addEventListener('click', () => {
            set('devMode', !get('devMode'));
        });

        // ── Dev tool buttons ──
        document.getElementById('sp-dev-unlock')?.addEventListener('click', () => {
            DevMode?.unlockAll?.();
            _devLog('✅ Đã mở khóa tất cả bài học');
        });

        document.getElementById('sp-dev-skip')?.addEventListener('click', () => {
            DevMode?.skipStep?.();
            _devLog('⏭ Bỏ qua bước hiện tại');
        });

        document.getElementById('sp-dev-reset')?.addEventListener('click', () => {
            if (confirm('Reset toàn bộ tiến trình học?')) {
                DevMode?.resetProgress?.();
                _devLog('🔄 Reset tiến trình');
            }
        });

        document.getElementById('sp-dev-goto')?.addEventListener('click', () => {
            const sel = document.getElementById('sp-dev-lesson-sel');
            if (!sel?.value) return;
            DevMode?.gotoLesson?.(sel.value);
            _devLog('→ Bài học: ' + sel.value);
            hide();
        });

        // Populate lesson selector
        const sel = document.getElementById('sp-dev-lesson-sel');
        if (sel && typeof LessonsData !== 'undefined') {
            LessonsData.getAll().forEach((l, i) => {
                const o = document.createElement('option');
                o.value = l.id;
                o.textContent = `${i + 1}. ${l.title}`;
                sel.appendChild(o);
            });
        }

        // Subscribe to input state changes
        if (typeof InputRouter !== 'undefined') {
            InputRouter.onStateChange(_refreshInputStatus);
        }

        _refreshInputStatus();
    }

    function _wireSlider(sliderId, valId, fmt, onchange) {
        const slider = document.getElementById(sliderId);
        const valEl  = document.getElementById(valId);
        if (!slider) return;
        slider.addEventListener('input', () => {
            _updateSliderFill(slider);
            if (valEl) valEl.textContent = fmt(slider.value);
            onchange(slider.value);
        });
        _updateSliderFill(slider);
    }

    function _updateSliderFill(slider) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const pct = ((val - min) / (max - min) * 100).toFixed(1);
        slider.style.setProperty('--pct', pct + '%');
    }

    function _wireStepper(dnId, upId, valId, key, min, max, step, fmt = v => String(v)) {
        const valEl = document.getElementById(valId);
        const update = next => {
            if (valEl) valEl.textContent = fmt(next);
            set(key, next);
        };
        document.getElementById(dnId)?.addEventListener('click', () =>
            update(Math.max(min, get(key) - step)));
        document.getElementById(upId)?.addEventListener('click', () =>
            update(Math.min(max, get(key) + step)));
    }

    function _refreshInputStatus() {
        if (typeof InputRouter === 'undefined') return;
        const st = InputRouter.getState();
        const midiOn  = !!(st.midi && st.midiDevices?.length);
        const midiName = st.midi && st.midiDevices?.[0]
            ? st.midiDevices[0].name.slice(0, 18) : '—';

        // Connection section dots + names
        const dotMidi  = document.getElementById('sp-dot-midi');
        const nameMidi = document.getElementById('sp-midi-name');
        const dotMic   = document.getElementById('sp-dot-mic');
        const btnMidi  = document.getElementById('sp-midi-connect');
        const btnMic   = document.getElementById('sp-mic-connect');

        if (dotMidi)  dotMidi.classList.toggle('on', midiOn);
        if (nameMidi) {
            nameMidi.textContent = midiName;
            nameMidi.classList.toggle('connected', midiOn);
        }
        if (dotMic)  dotMic.classList.toggle('on', !!st.mic);
        if (btnMidi) btnMidi.textContent = st.midi ? 'Ngắt' : 'Kết nối';
        if (btnMic)  btnMic.textContent  = st.mic  ? 'Ngắt' : 'Kết nối';

        // Dev section dots
        const devDotMidi  = document.getElementById('sp-dev-dot-midi');
        const devNameMidi = document.getElementById('sp-dev-midi-name');
        const devDotMic   = document.getElementById('sp-dev-dot-mic');
        if (devDotMidi)  devDotMidi.classList.toggle('on', midiOn);
        if (devNameMidi) {
            devNameMidi.textContent = midiName;
            devNameMidi.classList.toggle('connected', midiOn);
        }
        if (devDotMic)  devDotMic.classList.toggle('on', !!st.mic);
    }

    function _devLog(msg) {
        const el = document.getElementById('sp-dev-log');
        if (!el) { console.log('[Settings]', msg); return; }
        const line = document.createElement('div');
        const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        line.textContent = `[${t}] ${msg}`;
        el.insertBefore(line, el.firstChild);
        if (el.children.length > 14) el.removeChild(el.lastChild);
    }

    // ── Init ───────────────────────────────────────────────────────────────
    function init() {
        _load();

        // Wire gear button (already in HTML)
        document.getElementById('settings-gear-btn')?.addEventListener('click', toggle);

        _renderOverlay();
        _renderPanel();
    }

    function applyAll() {
        _applyAll();
    }

    return { init, applyAll, get, set, show, hide, toggle };
})();

window.SettingsPanel = SettingsPanel;
