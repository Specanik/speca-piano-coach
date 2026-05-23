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

window.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    setTheme(localStorage.getItem('piano-theme')   || 'classic');
    const savedLayout = localStorage.getItem('piano-layout') || '36';

    // Mobile sidebar controls
    document.getElementById('sidebar-toggle-btn')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-close-btn')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

    // Wire up controls
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', () => applyLayout(btn.dataset.layout));
    });

    // Connect audio + visualizer to keyboard events (set once)
    Keyboard.onNoteOnHandler(midi => {
        AudioEngine.startNote(midi, midi);
        Visualizer.noteOn(midi);
    });
    Keyboard.onNoteOffHandler(midi => {
        AudioEngine.stopNote(midi);
        Visualizer.noteOff(midi);
    });

    // Setup Chord UI
    try {
        ChordUI.init();
    } catch(e) {
        console.error('ChordUI.init failed:', e);
        var errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:40px;left:0;right:0;background:orange;color:#000;padding:12px;z-index:9999;font:14px monospace;white-space:pre-wrap;';
        errDiv.textContent = 'ChordUI.init ERROR: ' + e.message + '\n' + e.stack;
        document.body.appendChild(errDiv);
    }

    // Connect ChordPlayer to keyboard visualization (sync on/off per note)
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

    // Initial render
    try {
        applyLayout(savedLayout);
    } catch(e) {
        console.error('applyLayout failed:', e);
        var errDiv2 = document.createElement('div');
        errDiv2.style.cssText = 'position:fixed;top:90px;left:0;right:0;background:purple;color:#fff;padding:12px;z-index:9999;font:14px monospace;white-space:pre-wrap;';
        errDiv2.textContent = 'applyLayout ERROR: ' + e.message + '\n' + e.stack;
        document.body.appendChild(errDiv2);
    }
});
