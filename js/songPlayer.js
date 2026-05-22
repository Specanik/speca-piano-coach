const SongPlayer = (() => {
    let timers = [];
    let playing = false;
    let onStep = null;
    let onEnd = null;

    function clearTimers() {
        timers.forEach(id => clearTimeout(id));
        timers = [];
    }

    function stop() {
        playing = false;
        clearTimers();
        ChordPlayer.stopChord();
    }

    function resolveStepMidi(chordKey, variationType, variationIndex) {
        const chord = ChordsDB.getChord(chordKey);
        const list = chord?.variations[variationType] || [];
        if (!list.length) {
            return ChordsDB.getMidiNotes(chordKey, 'basic', 0);
        }
        const idx = Math.min(variationIndex, list.length - 1);
        return ChordsDB.getMidiNotes(chordKey, variationType, idx);
    }

    function scheduleStrumHit(midi, hit, step, patternId, variationType, variationIndex, isFirstOfStep) {
        const at = step.startMs + hit.beat * step.beatMs + (hit.humanizeMs || 0);
        const sustain = Math.max(
            220,
            Math.round(step.beatMs * (hit.sustainRatio || 0.4))
        );
        const pat = hit.pattern || patternId;

        const timer = setTimeout(() => {
            if (!playing) return;
            if (isFirstOfStep && hit.beat === 0) {
                ChordPlayer.playWithPattern(midi, pat, sustain, true);
            } else {
                ChordPlayer.playPulse(midi, pat, sustain);
            }
        }, at);
        timers.push(timer);
    }

    function play(timeline, patternId, variationType, variationIndex, onStepCb, onEndCb) {
        stop();
        if (!timeline.steps.length) return false;

        playing = true;
        onStep = onStepCb;
        onEnd = onEndCb;

        timeline.steps.forEach((step, index) => {
            const midi = resolveStepMidi(step.chordKey, variationType, variationIndex);
            if (!midi.length) return;

            const hits = step.strumHits && step.strumHits.length
                ? step.strumHits
                : [{ beat: 0, pattern: patternId, sustainRatio: 0.5, humanizeMs: 0 }];

            hits.forEach((hit, hi) => {
                scheduleStrumHit(
                    midi, hit, step, patternId, variationType, variationIndex,
                    hi === 0
                );
            });

            const stepTimer = setTimeout(() => {
                if (!playing) return;
                if (onStep) onStep(index, step);
            }, step.startMs);
            timers.push(stepTimer);
        });

        const endTimer = setTimeout(() => {
            if (!playing) return;
            playing = false;
            ChordPlayer.stopChord();
            if (onEnd) onEnd();
        }, timeline.totalMs + 300);
        timers.push(endTimer);

        return true;
    }

    function isPlaying() {
        return playing;
    }

    return { play, stop, isPlaying };
})();
