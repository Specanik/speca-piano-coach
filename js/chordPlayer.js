const ChordPlayer = (() => {
    let isPlaying = false;
    const playingNotes = new Set();
    let onNotesChange = null;

    async function playChord(midiNotes, duration = 1500, delayBetween = 50) {
        if (isPlaying) stopChord();
        
        isPlaying = true;
        const startTime = Date.now();

        // Arpeggio: play notes sequentially
        for (let i = 0; i < midiNotes.length; i++) {
            const midi = midiNotes[i];
            setTimeout(() => {
                if (!isPlaying) return;
                AudioEngine.startNote(midi, midi);
                playingNotes.add(midi);
                updateVisualization();
            }, i * delayBetween);
        }

        // Stop all notes after duration
        setTimeout(() => {
            stopChord();
        }, duration);
    }

    function playChordHarmonically(midiNotes, duration = 1500) {
        if (isPlaying) stopChord();
        
        isPlaying = true;

        // Play all notes at once
        midiNotes.forEach(midi => {
            AudioEngine.startNote(midi, midi);
            playingNotes.add(midi);
        });
        
        updateVisualization();

        // Stop all notes after duration
        setTimeout(() => {
            stopChord();
        }, duration);
    }

    function stopChord() {
        playingNotes.forEach(midi => {
            AudioEngine.stopNote(midi);
        });
        playingNotes.clear();
        isPlaying = false;
        updateVisualization();
    }

    function updateVisualization() {
        if (onNotesChange) {
            onNotesChange(Array.from(playingNotes));
        }
    }

    function onNotesChangeHandler(cb) {
        onNotesChange = cb;
    }

    return {
        playChord,
        playChordHarmonically,
        stopChord,
        onNotesChangeHandler,
        isPlaying: () => isPlaying
    };
})();
