/**
 * Metronome — AudioContext-based metronome with visual beat callback.
 *
 * Uses the Web Audio look-ahead scheduling pattern for rock-solid timing.
 * Fires onBeat(beatIndex, isDownbeat) for visual UI updates.
 *
 * API:
 *   Metronome.start(bpm, beatsPerBar)
 *   Metronome.stop()
 *   Metronome.setBpm(bpm)
 *   Metronome.isPlaying()
 *   Metronome.onBeat(cb)     cb(beatIdx, isDownbeat)
 */
const Metronome = (() => {
    // Look-ahead scheduler constants
    const LOOK_AHEAD   = 0.1;   // seconds to schedule ahead
    const SCHEDULE_INT = 50;    // ms between scheduler calls

    let _ctx          = null;
    let _bpm          = 80;
    let _beatsPerBar  = 4;
    let _playing      = false;
    let _currentBeat  = 0;
    let _nextBeatTime = 0;
    let _timerId      = null;
    let _onBeat       = null;

    // ── Click sound synthesis ─────────────────────────────────────
    function _scheduleClick(time, isDownbeat) {
        if (!_ctx) return;

        const osc  = _ctx.createOscillator();
        const gain = _ctx.createGain();

        osc.connect(gain);
        gain.connect(_ctx.destination);

        osc.frequency.value  = isDownbeat ? 1050 : 880;
        gain.gain.setValueAtTime(isDownbeat ? 0.7 : 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.start(time);
        osc.stop(time + 0.045);
    }

    function _scheduler() {
        if (!_ctx) return;
        const secondsPerBeat = 60 / _bpm;

        while (_nextBeatTime < _ctx.currentTime + LOOK_AHEAD) {
            const beat        = _currentBeat;
            const isDownbeat  = beat === 0;
            const schedTime   = _nextBeatTime;

            _scheduleClick(schedTime, isDownbeat);

            // Visual callback — fire slightly before the actual beat
            const delay = Math.max(0, (schedTime - _ctx.currentTime) * 1000 - 15);
            setTimeout(() => {
                if (_playing && _onBeat) _onBeat(beat, isDownbeat);
            }, delay);

            _currentBeat  = (_currentBeat + 1) % _beatsPerBar;
            _nextBeatTime += secondsPerBeat;
        }
    }

    function _ensureCtx() {
        if (!_ctx) {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (_ctx.state === 'suspended') _ctx.resume();
    }

    // ── Public API ─────────────────────────────────────────────────
    function start(bpm = 80, beatsPerBar = 4) {
        if (_playing) stop();
        _ensureCtx();
        _bpm          = bpm;
        _beatsPerBar  = beatsPerBar;
        _currentBeat  = 0;
        _nextBeatTime = _ctx.currentTime + 0.05;
        _playing      = true;

        _timerId = setInterval(_scheduler, SCHEDULE_INT);
        _scheduler();
    }

    function stop() {
        _playing = false;
        if (_timerId) { clearInterval(_timerId); _timerId = null; }
    }

    function setBpm(bpm) {
        _bpm = Math.max(20, Math.min(300, bpm));
    }

    function getBpm() { return _bpm; }

    function isPlaying() { return _playing; }

    return { start, stop, setBpm, getBpm, isPlaying, onBeat: cb => { _onBeat = cb; } };
})();
