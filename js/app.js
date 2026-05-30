function setTheme(name) {
    document.body.dataset.theme = name;
    localStorage.setItem('piano-theme', name);
    document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === name);
    });
}

function applyLayout(layoutKey) {
    localStorage.setItem('piano-layout', layoutKey);
    document.querySelectorAll('.layout-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.layout === layoutKey);
    });

    Visualizer.destroy();
    const { canvas, noteMap } = Keyboard.render('keyboard', layoutKey);
    Visualizer.init(canvas, noteMap);
}

function openSidebar() {
    document.getElementById('app').classList.add('sidebar-open');
}
function closeSidebar() {
    document.getElementById('app').classList.remove('sidebar-open');
}

// ── MIDI / Mic indicator helpers ──────────────────────────────────────────
function updateMidiIndicator(connected) {
    const btn = document.getElementById('midi-toggle-btn');
    if (!btn) return;
    btn.classList.toggle('connected', connected);
    btn.title = connected ? 'MIDI đã kết nối — click để ngắt' : 'Kết nối bàn phím MIDI';
    btn.innerHTML = `<span class="midi-dot"></span>${connected ? 'MIDI ✓' : 'MIDI'}`;
}

function updateMicIndicator(active) {
    const btn = document.getElementById('mic-toggle-btn');
    if (!btn) return;
    btn.classList.toggle('connected', active);
    btn.innerHTML = active ? '🎤 Mic ✓' : '🎤 Mic';
}

// ── Bootstrap ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    setTheme(localStorage.getItem('piano-theme') || 'classic');
    const savedLayout = localStorage.getItem('piano-layout') || '36';

    // Mobile sidebar controls
    document.getElementById('sidebar-toggle-btn')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-close-btn')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

    // Wire up theme + layout controls
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => applyLayout(btn.dataset.layout));
    });

    // ── Initial keyboard render ──────────────────────────────────────────
    try {
        applyLayout(savedLayout);
    } catch(e) {
        console.error('applyLayout failed:', e);
        showError('applyLayout ERROR: ' + e.message, 'purple');
    }

    // ── InputRouter wires keyboard → audio + visualizer ─────────────────
    // LessonUI.init() will override these handlers for lesson mode.
    // For free-play mode (no lesson active), route directly:
    InputRouter.onNoteOn(midi => {
        AudioEngine.startNote(midi, midi);
        Visualizer.noteOn(midi);
    });
    InputRouter.onNoteOff(midi => {
        AudioEngine.stopNote(midi);
        Visualizer.noteOff(midi);
    });
    InputRouter.attachKeyboard();

    InputRouter.onStateChange(state => {
        updateMidiIndicator(state.midi);
        updateMicIndicator(state.mic);
    });

    // ── MIDI toggle ──────────────────────────────────────────────────────
    let midiEnabled = false;
    document.getElementById('midi-toggle-btn')?.addEventListener('click', async () => {
        if (!MidiInput.isSupported()) {
            alert('Web MIDI API không được hỗ trợ trên trình duyệt này.\nDùng Chrome hoặc Edge.');
            return;
        }
        if (midiEnabled) {
            InputRouter.disableMidi();
            midiEnabled = false;
        } else {
            const ok = await InputRouter.enableMidi();
            midiEnabled = ok;
            if (!ok) alert('Không thể kết nối MIDI. Kiểm tra lại bàn phím và quyền truy cập.');
        }
    });

    // ── Mic toggle ───────────────────────────────────────────────────────
    let micEnabled = false;
    document.getElementById('mic-toggle-btn')?.addEventListener('click', async () => {
        if (micEnabled) {
            InputRouter.disableMic();
            micEnabled = false;
        } else {
            const ok = await InputRouter.enableMic();
            micEnabled = ok;
            if (!ok) alert('Không thể truy cập microphone. Kiểm tra quyền trong trình duyệt.');
        }
    });

    // ── ChordUI setup ────────────────────────────────────────────────────
    try {
        ChordUI.init();
    } catch(e) {
        console.error('ChordUI.init failed:', e);
        showError('ChordUI ERROR: ' + e.message, 'orange');
    }

    // Sync ChordPlayer → keyboard highlight + visualizer
    let chordVisNotes = new Set();
    ChordPlayer.onNotesChangeHandler(midiNotes => {
        ChordUI.updateKeyboardHighlight(midiNotes);

        const next = new Set(midiNotes);
        chordVisNotes.forEach(midi => {
            if (!next.has(midi)) Visualizer.noteOff(midi);
        });
        midiNotes.forEach(midi => {
            if (!chordVisNotes.has(midi)) Visualizer.noteOn(midi);
        });
        chordVisNotes = next;
    });

    // ── Lesson + Dashboard UI ────────────────────────────────────────────
    DashboardUI.init();
    LessonUI.init();
});

// ── Dev helper ────────────────────────────────────────────────────────────
function showError(msg, bg) {
    var d = document.createElement('div');
    d.style.cssText = `position:fixed;top:0;left:0;right:0;background:${bg};color:${bg==='orange'?'#000':'#fff'};padding:12px;z-index:9999;font:13px monospace;white-space:pre-wrap;`;
    d.textContent = msg;
    document.body.appendChild(d);
}
