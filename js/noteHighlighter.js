/**
 * NoteHighlighter — applies visual feedback classes to piano keys
 * based on whether the played note matches an expected set.
 *
 * States per key (CSS classes):
 *   .highlight-correct  — note is in the target set (green)
 *   .highlight-wrong    — note is NOT in the target set (red)
 *   .highlight-target   — note is expected but not yet played (blue/gold hint)
 *   (none)              — default state
 *
 * API:
 *   NoteHighlighter.setTarget(midiArray)   set which notes are expected
 *   NoteHighlighter.clearTarget()          remove all target/correct/wrong
 *   NoteHighlighter.noteOn(midi)           player pressed a key → colour it
 *   NoteHighlighter.noteOff(midi)          player released → clear feedback
 *   NoteHighlighter.showTargetHints()      highlight what should be pressed
 *   NoteHighlighter.hideTargetHints()      remove hint highlights
 */
const NoteHighlighter = (() => {
    let _targetSet = new Set();   // midi notes that should be played
    let _hintVisible = false;

    // ── DOM helpers ────────────────────────────────────────────────────────
    function keyEl(midi) {
        // Prefer the active view's piano so lesson piano and practice piano
        // don't interfere with each other (both live in DOM simultaneously).
        const activeView = document.querySelector('.view-active');
        if (activeView) {
            const el = activeView.querySelector(`.piano [data-midi="${midi}"]`);
            if (el) return el;
        }
        return document.querySelector(`.piano [data-midi="${midi}"]`);
    }

    function allKeyEls(midi) {
        // All matching keys across all views (for demo highlighting)
        return [...document.querySelectorAll(`.piano [data-midi="${midi}"]`)];
    }

    function clearClasses(el) {
        el.classList.remove(
            'highlight-correct',
            'highlight-wrong',
            'highlight-target'
        );
    }

    // ── Public API ─────────────────────────────────────────────────────────
    function setTarget(midiArray) {
        // Remove old target hints before replacing
        hideTargetHints();
        _targetSet = new Set(midiArray);
    }

    function clearTarget() {
        hideTargetHints();
        _targetSet.clear();
        // Also clear any lingering correct/wrong on all keys
        document.querySelectorAll('.piano [data-midi]').forEach(el => {
            clearClasses(el);
        });
    }

    function noteOn(midi) {
        const el = keyEl(midi);
        if (!el) return;
        clearClasses(el);

        if (_targetSet.size === 0) {
            // No active exercise — no feedback colour needed
            return;
        }

        if (_targetSet.has(midi)) {
            el.classList.add('highlight-correct');
        } else {
            el.classList.add('highlight-wrong');
        }
    }

    function noteOff(midi) {
        const el = keyEl(midi);
        if (!el) return;
        clearClasses(el);

        // Restore hint if the key is still in the target and hints are on
        if (_hintVisible && _targetSet.has(midi)) {
            el.classList.add('highlight-target');
        }
    }

    function showTargetHints() {
        _hintVisible = true;
        _targetSet.forEach(midi => {
            const el = keyEl(midi);
            if (!el) return;
            // Don't override correct/wrong while key is pressed
            if (!el.classList.contains('highlight-correct') &&
                !el.classList.contains('highlight-wrong')) {
                el.classList.add('highlight-target');
            }
        });
    }

    function hideTargetHints() {
        _hintVisible = false;
        document.querySelectorAll('.highlight-target').forEach(el => {
            el.classList.remove('highlight-target');
        });
    }

    /**
     * Check if all target notes are currently pressed (chord complete).
     * Used by LessonEngine to advance to the next step.
     */
    function isChordComplete(pressedSet) {
        if (_targetSet.size === 0) return false;
        for (const midi of _targetSet) {
            if (!pressedSet.has(midi)) return false;
        }
        return true;
    }

    return {
        setTarget,
        clearTarget,
        noteOn,
        noteOff,
        showTargetHints,
        hideTargetHints,
        isChordComplete,
        getTarget:  () => new Set(_targetSet),
        allKeyEls,
    };
})();
