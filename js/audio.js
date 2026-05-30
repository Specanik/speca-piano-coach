/**
 * AudioEngine — hybrid piano synthesizer.
 *
 * Strategy:
 *   1. Try to load piano audio samples from /audio/piano/ (C2–C7, mp3).
 *      Uses playbackRate pitch-shifting between sampled notes.
 *   2. If samples not available (404 / no server), falls back to the
 *      existing multi-oscillator synthesizer — no silent failure.
 *
 * Both modes expose the same API:
 *   AudioEngine.startNote(noteId, midi)
 *   AudioEngine.stopNote(noteId)
 *   AudioEngine.isUsingSamples()
 */
const AudioEngine = (() => {
    let _ctx        = null;
    let _masterGain = null;
    const _active   = new Map();

    // ── Sampler state ──────────────────────────────────────────────
    // Sampled notes: one sample per octave (C2–C7 = midi 36,48,60,72,84)
    const SAMPLE_NOTES = [36, 48, 60, 72, 84];
    const SAMPLE_DIR   = 'audio/piano/';
    const _buffers     = new Map();   // midi → AudioBuffer
    let _samplesLoaded = false;
    let _loadAttempted = false;

    // ── Audio context ──────────────────────────────────────────────
    function _ensureCtx() {
        if (!_ctx) {
            const AC = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
            _ctx = new AC();
            _masterGain = _ctx.createGain();
            _masterGain.gain.value = 0.6;
            _masterGain.connect(_ctx.destination);
        }
        if (_ctx.state === 'suspended') _ctx.resume();
    }

    // ── Sample loading ─────────────────────────────────────────────
    const NOTE_NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];

    function _midiToFilename(midi) {
        const name = NOTE_NAMES[midi % 12];
        const oct  = Math.floor(midi / 12) - 1;
        return `${name}${oct}.mp3`;
    }

    async function _loadSample(midi) {
        _ensureCtx();
        const url = SAMPLE_DIR + _midiToFilename(midi);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('not found');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await _ctx.decodeAudioData(arrayBuffer);
            _buffers.set(midi, audioBuffer);
            return true;
        } catch {
            return false;
        }
    }

    async function loadSamples() {
        if (_loadAttempted) return _samplesLoaded;
        _loadAttempted = true;
        _ensureCtx();

        const results = await Promise.all(SAMPLE_NOTES.map(_loadSample));
        _samplesLoaded = results.some(Boolean);
        return _samplesLoaded;
    }

    // ── Find nearest sampled note ──────────────────────────────────
    function _nearestSample(midi) {
        let best = SAMPLE_NOTES[0], bestDist = Infinity;
        for (const n of SAMPLE_NOTES) {
            if (_buffers.has(n)) {
                const d = Math.abs(midi - n);
                if (d < bestDist) { bestDist = d; best = n; }
            }
        }
        return best;
    }

    // ── Sampler playback ───────────────────────────────────────────
    function _startSample(noteId, midi) {
        _ensureCtx();
        if (_active.has(noteId)) return;

        const sampleMidi = _nearestSample(midi);
        const buffer     = _buffers.get(sampleMidi);
        if (!buffer) { _startOscillator(noteId, midi); return; }

        const semitones   = midi - sampleMidi;
        const playbackRate = Math.pow(2, semitones / 12);
        const now          = _ctx.currentTime;

        const source = _ctx.createBufferSource();
        source.buffer      = buffer;
        source.playbackRate.value = playbackRate;
        source.loop        = false;

        const gainNode = _ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.9, now + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.3);
        source.connect(gainNode);
        gainNode.connect(_masterGain);
        source.start(now);

        _active.set(noteId, { type: 'sample', source, gainNode });
    }

    function _stopSample(noteId) {
        if (!_active.has(noteId)) return;
        const { source, gainNode } = _active.get(noteId);
        const now         = _ctx.currentTime;
        const releaseTime = 0.8;
        try {
            gainNode.gain.cancelScheduledValues(now);
            gainNode.gain.setValueAtTime(Math.max(gainNode.gain.value, 0.001), now);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
            source.stop(now + releaseTime + 0.05);
        } catch {}
        _active.delete(noteId);
    }

    // ── Oscillator fallback ────────────────────────────────────────
    function _midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function _startOscillator(noteId, midi) {
        _ensureCtx();
        if (_active.has(noteId)) return;

        const freq = _midiToFreq(midi);
        const now  = _ctx.currentTime;

        const envelope = _ctx.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1.0, now + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.4, now + 0.2);
        envelope.connect(_masterGain);

        const oscillators = [];
        const add = (type, mult, gain) => {
            const osc = _ctx.createOscillator();
            const g   = _ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq * mult;
            g.gain.value = gain;
            osc.connect(g);
            g.connect(envelope);
            osc.start(now);
            oscillators.push(osc);
        };

        add('triangle', 1, 1.00);
        add('sine',     2, 0.35);
        add('sine',     3, 0.15);
        add('sine',     4, 0.06);

        // Hammer thump
        const thump     = _ctx.createOscillator();
        const thumpGain = _ctx.createGain();
        thump.type = 'sine';
        thump.frequency.value = 80;
        thumpGain.gain.setValueAtTime(0.25, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        thump.connect(thumpGain);
        thumpGain.connect(_masterGain);
        thump.start(now);
        thump.stop(now + 0.08);

        _active.set(noteId, { type: 'osc', envelope, oscillators });
    }

    function _stopOscillator(noteId) {
        if (!_active.has(noteId)) return;
        const { envelope, oscillators } = _active.get(noteId);
        const now         = _ctx.currentTime;
        const releaseTime = 1.2;
        try {
            envelope.gain.cancelScheduledValues(now);
            envelope.gain.setValueAtTime(Math.max(envelope.gain.value, 0.001), now);
            envelope.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
        } catch {}
        oscillators.forEach(o => { try { o.stop(now + releaseTime + 0.05); } catch {} });
        _active.delete(noteId);
    }

    // ── Public API ─────────────────────────────────────────────────
    function startNote(noteId, midi) {
        if (_samplesLoaded) {
            _startSample(noteId, midi);
        } else {
            _startOscillator(noteId, midi);
            // Try loading samples in background on first note
            if (!_loadAttempted) {
                loadSamples().then(ok => {
                    if (ok) console.info('[AudioEngine] Samples loaded ✓');
                });
            }
        }
    }

    function stopNote(noteId) {
        if (!_active.has(noteId)) return;
        const entry = _active.get(noteId);
        if (entry.type === 'sample') {
            _stopSample(noteId);
        } else {
            _stopOscillator(noteId);
        }
    }

    function isUsingSamples() { return _samplesLoaded; }

    return { startNote, stopNote, loadSamples, isUsingSamples };
})();
