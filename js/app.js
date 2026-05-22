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

window.addEventListener('DOMContentLoaded', () => {
    // Restore saved preferences
    setTheme(localStorage.getItem('piano-theme')   || 'classic');
    const savedLayout = localStorage.getItem('piano-layout') || '36';

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
    ChordUI.init();

    // Connect ChordPlayer to keyboard visualization
    ChordPlayer.onNotesChangeHandler(midiNotes => {
        ChordUI.updateKeyboardHighlight(midiNotes);
        midiNotes.forEach(midi => Visualizer.noteOn(midi));
    });

    // Initial render
    applyLayout(savedLayout);
});
