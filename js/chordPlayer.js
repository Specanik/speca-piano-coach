const ChordPlayer = (() => {
    const SUSTAIN_MS      = 2000;
    const SPACING_MIN     = 50;
    const SPACING_MAX     = 400;
    const SPACING_DEFAULT = 130;

    let isPlaying    = false;
    const playingNotes = new Set();
    let onNotesChange = null;
    let stopTimer     = null;
    let noteSpacingMs = SPACING_DEFAULT;

    // ── Pattern definitions ───────────────────────────────────────────────────
    // sequential : true  → notes played one by one with noteSpacingMs delay
    // isBassFirst: true  → bass note first, then remaining notes simultaneously
    const PATTERNS = {
        block: {
            label: 'Đồng thời',
            order: notes => [...notes],
            sequential: false
        },
        bassFirst: {
            label: 'Bass trước',
            order: notes => [...notes].sort((a, b) => a - b),
            sequential: true,
            isBassFirst: true
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
        },
        arpeggioUpDown: {
            label: 'Lên rồi xuống',
            order: notes => {
                const asc = [...notes].sort((a, b) => a - b);
                const desc = asc.slice(0, -1).reverse();
                return [...asc, ...desc];
            },
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
        if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
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

        // ── Bass-first: bass alone then chord ──
        if (pattern.isBassFirst && ordered.length > 1) {
            const bass = ordered[0];
            const rest = ordered.slice(1);
            AudioEngine.startNote(bass, bass);
            playingNotes.add(bass);
            updateVisualization();

            setTimeout(() => {
                if (!isPlaying) return;
                rest.forEach(midi => {
                    AudioEngine.startNote(midi, midi);
                    playingNotes.add(midi);
                });
                updateVisualization();
            }, noteSpacingMs);

            stopTimer = setTimeout(() => {
                if (interruptPrevious) stopChord();
                else releaseNotes(ordered);
            }, noteSpacingMs + sustainMs);
            return;
        }

        // ── Block: all at once ──
        if (!pattern.sequential) {
            startNotes(ordered);
            stopTimer = setTimeout(() => {
                if (interruptPrevious) stopChord();
                else releaseNotes(ordered);
            }, sustainMs);
            return;
        }

        // ── Sequential arpeggio ──
        ordered.forEach((midi, i) => {
            setTimeout(() => {
                if (!isPlaying) return;
                AudioEngine.startNote(midi, midi);
                playingNotes.add(midi);
                updateVisualization();
            }, i * noteSpacingMs);
        });

        const totalMs = (ordered.length - 1) * noteSpacingMs + sustainMs;
        stopTimer = setTimeout(() => {
            if (interruptPrevious) stopChord();
            else releaseNotes(ordered);
        }, totalMs);
    }

    /** Rhythmic re-attack (pulse within same chord) */
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

        if (pattern.isBassFirst && ordered.length > 1) {
            const bass = ordered[0];
            const rest = ordered.slice(1);
            const delay = Math.min(40, noteSpacingMs);
            AudioEngine.startNote(bass, bass);
            playingNotes.add(bass);
            updateVisualization();
            setTimeout(() => {
                rest.forEach(midi => { AudioEngine.startNote(midi, midi); playingNotes.add(midi); });
                updateVisualization();
            }, delay);
            stopTimer = setTimeout(() => releaseNotes(ordered), delay + sustainMs);
            return;
        }

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
            if (playingNotes.has(m)) { AudioEngine.stopNote(m); playingNotes.delete(m); }
        });
        if (playingNotes.size === 0) isPlaying = false;
        updateVisualization();
    }

    function playChordHarmonically(midiNotes, duration = 1500) {
        playWithPattern(midiNotes, 'block', duration);
    }

    function stopChord() {
        clearStopTimer();
        playingNotes.forEach(midi => AudioEngine.stopNote(midi));
        playingNotes.clear();
        isPlaying = false;
        updateVisualization();
    }

    function updateVisualization() {
        if (onNotesChange) onNotesChange(Array.from(playingNotes));
    }

    function onNotesChangeHandler(cb) { onNotesChange = cb; }

    function getPatterns() {
        return Object.entries(PATTERNS).map(([id, p]) => ({ id, label: p.label }));
    }

    function isSequentialPattern(patternId) {
        return !!(PATTERNS[patternId] || PATTERNS.block).sequential;
    }

    function setNoteSpacing(ms) {
        noteSpacingMs = Math.min(SPACING_MAX, Math.max(SPACING_MIN, ms));
    }

    function getNoteSpacing() { return noteSpacingMs; }

    function getEstimatedDuration(noteCount, patternId) {
        const pattern = PATTERNS[patternId] || PATTERNS.block;
        if (!pattern.sequential || noteCount <= 1) return SUSTAIN_MS;
        if (pattern.isBassFirst) return noteSpacingMs + SUSTAIN_MS;
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
