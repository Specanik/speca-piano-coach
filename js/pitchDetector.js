/**
 * PitchDetector — detects fundamental pitch from microphone using
 * the autocorrelation (YIN-lite) algorithm via Web Audio API.
 *
 * API:
 *   PitchDetector.start()          → Promise<bool>  request mic, begin detection
 *   PitchDetector.stop()           → void
 *   PitchDetector.isRunning()      → bool
 *   PitchDetector.onNote(cb)       → cb({ midi, freq, name, confidence })
 *   PitchDetector.onNoteOn(cb)     → cb(midi)  fired when a new note starts
 *   PitchDetector.onNoteOff(cb)    → cb(midi)  fired when the note stops
 *   PitchDetector.setThreshold(v)  → set RMS threshold (0–1, default 0.015)
 */
const PitchDetector = (() => {
    const SAMPLE_RATE     = 44100;
    const BUFFER_SIZE     = 4096;
    const MIN_FREQ        = 27.5;    // A0
    const MAX_FREQ        = 4200;    // C8+
    const NOTE_NAMES      = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const CONFIDENCE_MIN  = 0.90;    // minimum autocorrelation confidence

    let _audioCtx     = null;
    let _analyser     = null;
    let _scriptProc   = null;
    let _stream       = null;
    let _running      = false;
    let _rmsThreshold = 0.015;

    let _onNote    = null;
    let _onNoteOn  = null;
    let _onNoteOff = null;

    let _lastMidi = -1;
    let _silenceFrames = 0;
    const SILENCE_GRACE = 6;   // frames of silence before firing noteOff

    // ── Math helpers ───────────────────────────────────────────────────────
    function freqToMidi(freq) {
        return Math.round(12 * Math.log2(freq / 440) + 69);
    }

    function midiToName(midi) {
        return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
    }

    function rms(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        return Math.sqrt(sum / buffer.length);
    }

    /**
     * Autocorrelation-based pitch estimation.
     * Returns { freq, confidence } or null if no clear pitch found.
     */
    function detectPitch(buffer, sampleRate) {
        const n = buffer.length;
        const minPeriod = Math.floor(sampleRate / MAX_FREQ);
        const maxPeriod = Math.floor(sampleRate / MIN_FREQ);

        // Compute autocorrelation
        let bestCorr   = -1;
        let bestPeriod = -1;

        // We only compute for the valid period range to save CPU
        let lastCorr = 1;
        let goingUp  = false;

        for (let period = minPeriod; period <= maxPeriod; period++) {
            let corr = 0;
            for (let i = 0; i < n - period; i++) {
                corr += buffer[i] * buffer[i + period];
            }
            corr /= (n - period);

            if (corr > bestCorr) {
                bestCorr   = corr;
                bestPeriod = period;
            }

            if (corr > lastCorr) {
                goingUp = true;
            } else if (goingUp && corr < lastCorr * 0.98) {
                // Local maximum found — this is our winner
                break;
            }
            lastCorr = corr;
        }

        if (bestPeriod < 0 || bestCorr < CONFIDENCE_MIN * rms(buffer) * rms(buffer)) {
            return null;
        }

        const freq = sampleRate / bestPeriod;
        if (freq < MIN_FREQ || freq > MAX_FREQ) return null;

        return { freq, confidence: bestCorr };
    }

    // ── Processing ─────────────────────────────────────────────────────────
    function processAudio(event) {
        if (!_running) return;
        const buffer = event.inputBuffer.getChannelData(0);
        const amplitude = rms(buffer);

        if (amplitude < _rmsThreshold) {
            _silenceFrames++;
            if (_silenceFrames >= SILENCE_GRACE && _lastMidi !== -1) {
                _onNoteOff && _onNoteOff(_lastMidi);
                _lastMidi = -1;
            }
            return;
        }
        _silenceFrames = 0;

        const result = detectPitch(buffer, _audioCtx.sampleRate);
        if (!result) return;

        const midi = freqToMidi(result.freq);
        if (midi < 21 || midi > 108) return;   // outside piano range

        const payload = {
            midi,
            freq: result.freq,
            name: midiToName(midi),
            confidence: result.confidence
        };

        _onNote && _onNote(payload);

        if (midi !== _lastMidi) {
            if (_lastMidi !== -1) _onNoteOff && _onNoteOff(_lastMidi);
            _onNoteOn && _onNoteOn(midi);
            _lastMidi = midi;
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────
    async function start() {
        if (_running) return true;
        if (!navigator.mediaDevices?.getUserMedia) {
            console.warn('[PitchDetector] getUserMedia not supported.');
            return false;
        }

        try {
            _stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: SAMPLE_RATE
            });

            const source = _audioCtx.createMediaStreamSource(_stream);

            // ScriptProcessorNode is deprecated but has widest support.
            // For future: replace with AudioWorkletNode.
            _scriptProc = _audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
            _scriptProc.onaudioprocess = processAudio;

            source.connect(_scriptProc);
            _scriptProc.connect(_audioCtx.destination);

            _running = true;
            return true;
        } catch (err) {
            console.warn('[PitchDetector] Could not start:', err);
            return false;
        }
    }

    function stop() {
        if (!_running) return;
        _running = false;

        if (_lastMidi !== -1) {
            _onNoteOff && _onNoteOff(_lastMidi);
            _lastMidi = -1;
        }

        if (_scriptProc) { _scriptProc.disconnect(); _scriptProc = null; }
        if (_audioCtx)   { _audioCtx.close(); _audioCtx = null; }
        if (_stream)     { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
    }

    return {
        start,
        stop,
        isRunning:    () => _running,
        setThreshold: v => { _rmsThreshold = v; },
        onNote:       cb => { _onNote    = cb; },
        onNoteOn:     cb => { _onNoteOn  = cb; },
        onNoteOff:    cb => { _onNoteOff = cb; },
    };
})();
