/**
 * FallingNotes — Canvas-based falling notes visualizer.
 *
 * Inspired by Simply Piano / Synthesia:
 *   • Notes fall from top → hit zone at bottom
 *   • Color: white keys = blue, black keys = purple
 *   • "Wait mode": playback pauses until correct note detected
 *   • "Performance mode": notes fall at fixed speed (no waiting)
 *
 * API:
 *   FallingNotes.init(canvasEl, noteMapObj)   attach to a canvas
 *   FallingNotes.loadSequence(steps, bpm)     load a lesson play sequence
 *   FallingNotes.start()                      begin animation + scheduling
 *   FallingNotes.stop()                       stop everything
 *   FallingNotes.noteOn(midi)                 player pressed a key
 *   FallingNotes.noteOff(midi)                player released a key
 *   FallingNotes.setWaitMode(bool)            toggle wait mode
 *   FallingNotes.onStepComplete(cb)           cb(stepIdx, result)
 *   FallingNotes.onSequenceEnd(cb)            cb(results[])
 */
const FallingNotes = (() => {
    // Visual constants
    const HIT_ZONE_H   = 20;    // px height of hit line at bottom
    const NOTE_SPEED   = 120;   // px per second (performance mode)
    const NOTE_MIN_H   = 16;    // px minimum note bar height
    const FALL_DIST    = 0.85;  // fraction of canvas height above hit zone

    const COLORS = {
        white:   { fill: '#4a9eff', glow: 'rgba(74,158,255,0.5)' },
        black:   { fill: '#b070ff', glow: 'rgba(176,112,255,0.5)' },
        correct: { fill: '#50c878', glow: 'rgba(80,200,120,0.6)' },
        wrong:   { fill: '#ff5050', glow: 'rgba(255,80,80,0.6)'  },
        hit:     { fill: '#ffffff', glow: 'rgba(255,255,255,0.8)' },
    };

    let _canvas   = null;
    let _ctx      = null;
    let _noteMap  = {};       // midi → { xCenter, width, isBlack }
    let _animId   = null;
    let _lastTs   = null;

    // Sequence state
    let _steps         = [];    // [{ midi: number|number[], label, durationMs }]
    let _bpm           = 80;
    let _beatMs        = 750;   // ms per beat
    let _stepIdx       = 0;     // current expected step
    let _waitMode      = true;  // Simply Piano-style wait
    let _waiting       = false; // currently paused waiting for correct note
    let _timeOffset    = 0;     // pause/resume offset accumulator

    // Falling note objects
    let _fallingBars   = [];    // active visual bars
    let _hitFlashes    = [];    // brief flash on correct hit
    let _pressedKeys   = new Set();

    // Callbacks
    let _onStepComplete = null;
    let _onSequenceEnd  = null;

    // ── Setup ──────────────────────────────────────────────────────
    function init(canvasEl, noteMapObj) {
        _canvas  = canvasEl;
        _ctx     = canvasEl.getContext('2d');
        _noteMap = noteMapObj || {};
        _fallingBars = [];
        _hitFlashes  = [];
    }

    function loadSequence(steps, bpm = 80) {
        _steps   = steps;
        _bpm     = bpm;
        _beatMs  = 60000 / bpm;
        _stepIdx = 0;
        _waiting = false;
        _timeOffset = 0;
        _fallingBars = [];
        _hitFlashes  = [];
        _scheduleVisibleBars();
    }

    // ── Schedule which bars should be visible ─────────────────────
    function _scheduleVisibleBars() {
        if (!_canvas || !_steps.length) return;

        const H        = _canvas.height;
        const hitY     = H - HIT_ZONE_H;
        const fallH    = hitY * FALL_DIST;   // distance notes travel before hit
        const travelMs = (fallH / NOTE_SPEED) * 1000;

        // Show bars for next ~3 beats
        const lookaheadBeats = 3;
        const lookaheadMs    = lookaheadBeats * _beatMs;

        // Clear and re-add upcoming bars based on current stepIdx
        const now = performance.now();

        _steps.forEach((step, i) => {
            if (i < _stepIdx) return;
            const startOffset = (i - _stepIdx) * _beatMs;
            if (startOffset > lookaheadMs) return;

            const midis = Array.isArray(step.midi) ? step.midi : [step.midi];
            const noteH = Math.max(NOTE_MIN_H, _beatMs * NOTE_SPEED / 1000 * 0.7);

            midis.forEach(midi => {
                const info = _noteMap[midi];
                if (!info) return;

                // Check not already added
                if (_fallingBars.some(b => b.stepIdx === i && b.midi === midi)) return;

                _fallingBars.push({
                    midi,
                    stepIdx: i,
                    x:       info.xCenter - info.width / 2 + 2,
                    width:   info.width - 4,
                    y:       -noteH - startOffset * NOTE_SPEED / 1000,
                    height:  noteH,
                    isBlack: info.isBlack,
                    state:   'falling',  // falling | hit | wrong | done
                    hitTime: null,
                });
            });
        });
    }

    // ── Animation loop ─────────────────────────────────────────────
    function _loop(ts) {
        _animId = requestAnimationFrame(_loop);

        if (!_canvas || !_ctx) return;

        const H   = _canvas.height;
        const W   = _canvas.width;
        const dt  = _lastTs ? Math.min((ts - _lastTs) / 1000, 0.05) : 0;
        _lastTs   = ts;

        const speed = _waiting ? 0 : NOTE_SPEED;
        const hitY  = H - HIT_ZONE_H;

        _ctx.clearRect(0, 0, W, H);

        // ── Hit zone line ──────────────────────────────────────────
        _ctx.fillStyle = 'rgba(255,255,255,0.07)';
        _ctx.fillRect(0, hitY, W, 1);

        _ctx.fillStyle = 'rgba(74,158,255,0.12)';
        _ctx.fillRect(0, hitY, W, HIT_ZONE_H);

        // ── Update & draw falling bars ─────────────────────────────
        for (let i = _fallingBars.length - 1; i >= 0; i--) {
            const bar = _fallingBars[i];
            bar.y += speed * dt;

            // Check if bar reached hit zone (auto-advance in perf mode)
            const barBottom = bar.y + bar.height;
            if (!_waitMode && barBottom >= hitY && bar.state === 'falling') {
                // Performance mode: auto-advance to next step
                if (bar.stepIdx === _stepIdx) {
                    _advanceStep(bar.stepIdx, false);
                }
            }

            // Remove bars that scrolled off screen
            if (bar.y > H + 20) {
                _fallingBars.splice(i, 1);
                continue;
            }

            // Draw
            const color = COLORS[bar.isBlack ? 'black' : 'white'];
            let fillColor = color.fill;
            let glowColor = color.glow;

            if (bar.state === 'hit') {
                fillColor = COLORS.correct.fill;
                glowColor = COLORS.correct.glow;
            } else if (bar.state === 'wrong') {
                fillColor = COLORS.wrong.fill;
                glowColor = COLORS.wrong.glow;
            }

            // Glow effect
            _ctx.save();
            _ctx.shadowBlur  = 10;
            _ctx.shadowColor = glowColor;
            _ctx.fillStyle   = fillColor;

            const alpha = bar.y < 0 ? Math.max(0, (bar.y + bar.height) / bar.height) : 1;
            _ctx.globalAlpha = alpha;

            _roundRect(bar.x, Math.max(bar.y, 0),
                bar.width, Math.min(bar.height, bar.y < 0 ? bar.height + bar.y : bar.height),
                4);
            _ctx.restore();
        }

        // ── Draw hit flashes ───────────────────────────────────────
        for (let i = _hitFlashes.length - 1; i >= 0; i--) {
            const f = _hitFlashes[i];
            f.alpha -= dt * 4;
            if (f.alpha <= 0) { _hitFlashes.splice(i, 1); continue; }

            _ctx.save();
            _ctx.globalAlpha = f.alpha;
            _ctx.fillStyle   = f.correct ? COLORS.correct.fill : COLORS.wrong.fill;
            _ctx.shadowBlur  = 16;
            _ctx.shadowColor = f.correct ? COLORS.correct.glow : COLORS.wrong.glow;
            _roundRect(f.x, hitY - 8, f.width, HIT_ZONE_H + 8, 4);
            _ctx.restore();
        }

        // ── Schedule more bars if needed ───────────────────────────
        if (!_waiting && _stepIdx < _steps.length) {
            _scheduleVisibleBars();
        }
    }

    function _roundRect(x, y, w, h, r) {
        if (!_ctx) return;
        _ctx.beginPath();
        if (_ctx.roundRect) {
            _ctx.roundRect(x, y, w, h, r);
        } else {
            _ctx.rect(x, y, w, h);
        }
        _ctx.fill();
    }

    // ── Note input ─────────────────────────────────────────────────
    function noteOn(midi) {
        _pressedKeys.add(midi);
        if (_stepIdx >= _steps.length) return;

        const step   = _steps[_stepIdx];
        const target = Array.isArray(step.midi) ? step.midi : [step.midi];
        const correct = target.includes(midi);

        // Mark falling bar state
        const bar = _fallingBars.find(b => b.midi === midi && b.stepIdx === _stepIdx);
        if (bar) {
            bar.state   = correct ? 'hit' : 'wrong';
            bar.hitTime = performance.now();
        }

        // Flash
        const info = _noteMap[midi];
        if (info) {
            _hitFlashes.push({
                x: info.xCenter - info.width / 2 + 2,
                width: info.width - 4,
                alpha: 1,
                correct
            });
        }

        // Wait mode: check if all target notes are pressed
        if (_waitMode && _waiting) {
            const allPressed = target.every(m => _pressedKeys.has(m));
            if (allPressed) {
                _waiting = false;
                _advanceStep(_stepIdx, true);
            }
        }
    }

    function noteOff(midi) {
        _pressedKeys.delete(midi);
    }

    // ── Step advancement ───────────────────────────────────────────
    function _advanceStep(idx, correct) {
        const step   = _steps[idx];
        const target = Array.isArray(step.midi) ? step.midi : [step.midi];

        const result = { stepIdx: idx, correct, midi: target };
        _onStepComplete && _onStepComplete(idx, result);

        _stepIdx = idx + 1;

        if (_stepIdx >= _steps.length) {
            // Sequence complete — wait for last bars to exit then fire
            setTimeout(() => {
                _onSequenceEnd && _onSequenceEnd();
            }, 600);
            return;
        }

        // In wait mode, pause for next step and show it
        if (_waitMode) {
            _waiting = true;
            _scheduleVisibleBars();
        }
    }

    // ── Public control ─────────────────────────────────────────────
    function start() {
        if (_animId) cancelAnimationFrame(_animId);
        _lastTs  = null;
        _waiting = _waitMode;   // start paused if wait mode
        _animId  = requestAnimationFrame(_loop);
        _scheduleVisibleBars();
    }

    function stop() {
        if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
        if (_ctx && _canvas) _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        _fallingBars = [];
        _hitFlashes  = [];
    }

    function setWaitMode(val) {
        _waitMode = val;
        if (!val) _waiting = false;
    }

    function resize(w, h) {
        if (!_canvas) return;
        _canvas.width  = w;
        _canvas.height = h;
    }

    return {
        init,
        loadSequence,
        start,
        stop,
        noteOn,
        noteOff,
        setWaitMode,
        resize,
        isWaitMode: () => _waitMode,
        onStepComplete: cb => { _onStepComplete = cb; },
        onSequenceEnd:  cb => { _onSequenceEnd  = cb; },
    };
})();
