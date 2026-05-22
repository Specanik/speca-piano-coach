const ChordPlayer = (() => {
    const SUSTAIN_MS = 2000;
    const SPACING_MIN = 50;
    const SPACING_MAX = 400;
    const SPACING_DEFAULT = 130;

    let isPlaying = false;
    const playingNotes = new Set();
    let onNotesChange = null;
    let stopTimer = null;
    let noteSpacingMs = SPACING_DEFAULT;

    const PATTERNS = {
        block: {
            label: 'Đồng thời',
            order: notes => [...notes],
            sequential: false
        },
        arpeggioUp: {
            label: 'Rải lên',
            order: notes => [...notes].sort((a, b) => a - b),
            sequential: true
        },
        arpeggioDown: {
            label: 'Rải xuống',
            order: notes => [...notes].sort((a, b) => b - a),
            sequential: true
        }
    };

    function loadSpacing() {
        const saved = parseInt(localStorage.getItem('piano-chord-spacing'), 10);
        if (!Number.isNaN(saved)) {
            noteSpacingMs = Math.min(SPACING_MAX, Math.max(SPACING_MIN, saved));
        }
    }

    loadSpacing();

    function clearStopTimer() {
        if (stopTimer) {
            clearTimeout(stopTimer);
            stopTimer = null;
        }
    }

    function getDelayBetween(pattern) {
        return pattern.sequential ? noteSpacingMs : 0;
    }

    function startNotes(ordered) {
        ordered.forEach(midi => {
            AudioEngine.startNote(midi, midi);
            playingNotes.add(midi);
        });
        updateVisualization();
    }

    function playWithPattern(midiNotes, patternId = 'block', sustainMs = SUSTAIN_MS, interruptPrevious = true) {
        if (!midiNotes.length) return;

        if (interruptPrevious) {
            if (isPlaying) stopChord();
            isPlaying = true;
        } else if (!isPlaying) {
            isPlaying = true;
        }

        clearStopTimer();

        const pattern = PATTERNS[patternId] || PATTERNS.block;
        const ordered = pattern.order(midiNotes);
        const delayBetween = getDelayBetween(pattern);

        if (delayBetween === 0) {
            startNotes(ordered);
            stopTimer = setTimeout(() => {
                if (interruptPrevious) stopChord();
                else releaseNotes(ordered);
            }, sustainMs);
            return;
        }

        ordered.forEach((midi, i) => {
            setTimeout(() => {
                if (!isPlaying) return;
                AudioEngine.startNote(midi, midi);
                playingNotes.add(midi);
                updateVisualization();
            }, i * delayBetween);
        });

        const totalMs = (ordered.length - 1) * delayBetween + sustainMs;
        stopTimer = setTimeout(() => {
            if (interruptPrevious) stopChord();
            else releaseNotes(ordered);
        }, totalMs);
    }

    /** Rhythmic re-attack (giữa cùng một hợp âm) */
    function playPulse(midiNotes, patternId = 'block', sustainMs = 380) {
        if (!midiNotes.length) return;
        clearStopTimer();

        midiNotes.forEach(m => {
            if (playingNotes.has(m)) {
                AudioEngine.stopNote(m);
                playingNotes.delete(m);
            }
        });

        isPlaying = true;
        const pattern = PATTERNS[patternId] || PATTERNS.block;
        const ordered = pattern.order(midiNotes);
        const delayBetween = pattern.sequential ? Math.min(40, noteSpacingMs) : 0;

        if (delayBetween === 0) {
            startNotes(ordered);
        } else {
            ordered.forEach((midi, i) => {
                setTimeout(() => {
                    AudioEngine.startNote(midi, midi);
                    playingNotes.add(midi);
                    updateVisualization();
                }, i * delayBetween);
            });
        }

        stopTimer = setTimeout(() => releaseNotes(ordered), sustainMs);
    }

    function releaseNotes(midiNotes) {
        midiNotes.forEach(m => {
            if (playingNotes.has(m)) {
                AudioEngine.stopNote(m);
                playingNotes.delete(m);
            }
        });
        if (playingNotes.size === 0) isPlaying = false;
        updateVisualization();
    }

    function playChordHarmonically(midiNotes, duration = 1500) {
        playWithPattern(midiNotes, 'block', duration);
    }

    function stopChord() {
        clearStopTimer();
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

    function getPatterns() {
        return Object.entries(PATTERNS).map(([id, p]) => ({ id, label: p.label }));
    }

    function isSequentialPattern(patternId) {
        return !!(PATTERNS[patternId] || PATTERNS.block).sequential;
    }

    function setNoteSpacing(ms) {
        noteSpacingMs = Math.min(SPACING_MAX, Math.max(SPACING_MIN, ms));
    }

    function getNoteSpacing() {
        return noteSpacingMs;
    }

    function getEstimatedDuration(noteCount, patternId) {
        const pattern = PATTERNS[patternId] || PATTERNS.block;
        if (!pattern.sequential || noteCount <= 1) return SUSTAIN_MS;
        return (noteCount - 1) * noteSpacingMs + SUSTAIN_MS;
    }

    return {
        playWithPattern,
        playPulse,
        playChordHarmonically,
        stopChord,
        onNotesChangeHandler,
        getPatterns,
        isSequentialPattern,
        setNoteSpacing,
        getNoteSpacing,
        getEstimatedDuration,
        isPlaying: () => isPlaying
    };
})();
