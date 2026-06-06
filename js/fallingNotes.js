/**
 * FallingNotes — Canvas-based Synthesia-style falling notes.
 *
 * TIMING MODEL (fixed from original):
 *   pxPerSec = fallH / (lookaheadBeats * beatMs / 1000)
 *   → notes always reach hitzone exactly on beat, regardless of BPM.
 *
 * API:
 *   FallingNotes.init(canvasEl, noteMapObj)
 *   FallingNotes.loadSequence(steps, bpm)
 *   FallingNotes.start() / .stop()
 *   FallingNotes.noteOn(midi) / .noteOff(midi)
 *   FallingNotes.setWaitMode(bool)
 *   FallingNotes.setNoteMap(obj)       — call after piano resize
 *   FallingNotes.onStepComplete(cb)    — cb(stepIdx, {correct, midi})
 *   FallingNotes.onSequenceEnd(cb)     — cb(results[])
 */
const FallingNotes = (() => {
    const C   = window.PianoConfig?.fallingNotes ?? {};
    const HIT_ZONE_H      = C.hitZoneH        ?? 28;
    const HIT_WINDOW_MS   = C.hitWindowMs      ?? 120;
    const NOTE_MIN_H      = 16;
    const TRAVEL_FRACTION = C.travelFraction   ?? 0.80;
    const LOOKAHEAD_BEATS = 3;
    const PARTICLE_COUNT  = C.particleCount    ?? 14;
    const COLORS = {
        white:     { fill: C.colors?.whiteNote   ?? '#4a9eff', glow: 'rgba(74,158,255,0.50)' },  // right hand
        black:     { fill: C.colors?.blackNote   ?? '#7060e0', glow: 'rgba(112,96,224,0.50)' },  // right hand black
        leftHand:  { fill: C.colors?.leftNote    ?? '#ff8c40', glow: 'rgba(255,140,64,0.50)'  }, // left hand
        leftBlack: { fill: C.colors?.leftBlack   ?? '#cc5a00', glow: 'rgba(204,90,0,0.50)'   }, // left hand black
        hit:       { fill: C.colors?.hit         ?? '#50c878', glow: 'rgba(80,200,120,0.60)'  },
        miss:      { fill: C.colors?.miss        ?? '#ff5050', glow: 'rgba(255,80,80,0.60)'   },
        zone:      { fill: C.colors?.hitZoneBg   ?? 'rgba(74,158,255,0.10)' },
        particle:  { fill: C.colors?.particle    ?? '#ffe066' },
    };
    // Middle C (MIDI 60) divides left hand from right hand — configurable via setSplit()
    let _splitMidi  = 60;
    let _speedMult  = 1.0;
    let _handFilter = 'both'; // 'both' | 'left' | 'right'

    const _NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    // ── State ──────────────────────────────────────────────────────────────
    let _canvas  = null, _ctx = null;
    let _noteMap = {};
    let _animId  = null, _lastTs = null;

    // Sequence
    let _steps    = [];
    let _bpm      = 80;
    let _beatMs   = 750;
    let _pxPerSec = 200;   // derived from BPM + canvas height in _recalcSpeed()
    let _stepIdx  = 0;
    let _waitMode = true;
    let _waiting  = false;

    // Visuals
    let _bars      = [];   // { midi, stepIdx, x, y, w, h, isBlack, state, hitTime }
    let _flashes   = [];   // { x, w, alpha, correct }
    let _particles = [];   // { x, y, vx, vy, alpha, color }
    let _popups    = [];   // { x, y, vy, text, alpha } — floating score text
    let _pressed   = new Set();

    // Callbacks
    let _onStepComplete = null;
    let _onSequenceEnd  = null;
    let _results        = [];

    // ── Speed calculation (THE key fix) ────────────────────────────────────
    function _recalcSpeed() {
        if (!_canvas) return;
        const fallH = (_canvas.height - HIT_ZONE_H) * TRAVEL_FRACTION;
        const travelMs = LOOKAHEAD_BEATS * _beatMs;
        _pxPerSec = (fallH * 1000 / Math.max(travelMs, 1)) * _speedMult;
    }

    // ── Init / Load ────────────────────────────────────────────────────────
    function init(canvasEl, noteMapObj) {
        _canvas  = canvasEl;
        _ctx     = canvasEl.getContext('2d');
        _noteMap = noteMapObj || {};
        _bars = []; _flashes = []; _particles = [];
        _recalcSpeed();
    }

    function loadSequence(steps, bpm) {
        _steps   = steps || [];
        _bpm     = bpm   || 80;
        _beatMs  = 60000 / _bpm;
        _stepIdx = 0;
        _waiting = false;
        _results = [];
        _bars = []; _flashes = []; _particles = []; _popups = [];
        _recalcSpeed();
        _scheduleBars();
    }

    // ── Bar scheduling ──────────────────────────────────────────────────────
    function _scheduleBars() {
        if (!_canvas || !_steps.length) return;
        const H     = _canvas.height;
        const hitY  = H - HIT_ZONE_H;
        const fallH = hitY * TRAVEL_FRACTION;

        for (let i = _stepIdx; i < _steps.length; i++) {
            const beatsAhead = i - _stepIdx;
            if (beatsAhead > LOOKAHEAD_BEATS + 1) break;

            const step  = _steps[i];
            const midis = Array.isArray(step.midi) ? step.midi : [step.midi];

            // Support both durationBeats and durationMs (converted from ms at runtime)
            const db = step.durationBeats
                ?? (step.durationMs ? step.durationMs / _beatMs : 0.75);
            const noteH = Math.max(NOTE_MIN_H, (_beatMs / 1000) * _pxPerSec * db);

            // Initial Y: notes further ahead start higher up
            const yAboveHit = fallH * beatsAhead / LOOKAHEAD_BEATS;
            const yTop      = hitY - noteH - yAboveHit;

            midis.forEach(midi => {
                // Hand filter: skip notes not matching the active hand
                if (_handFilter === 'left'  && midi >= _splitMidi) return;
                if (_handFilter === 'right' && midi < _splitMidi)  return;

                if (_bars.some(b => b.stepIdx === i && b.midi === midi)) return;
                const info = _noteMap[midi];
                if (!info) return;
                _bars.push({
                    midi, stepIdx: i,
                    x: info.xCenter - info.width / 2 + 2,
                    y: yTop,
                    w: info.width - 4,
                    h: noteH,
                    isBlack: info.isBlack,
                    state: 'falling',
                    hitTime: null,
                });
            });
        }
    }

    // ── Animation loop ──────────────────────────────────────────────────────
    function _loop(ts) {
        _animId = requestAnimationFrame(_loop);
        if (!_canvas || !_ctx) return;

        const W  = _canvas.width;
        const H  = _canvas.height;
        const dt = _lastTs ? Math.min((ts - _lastTs) / 1000, 0.05) : 0;
        _lastTs  = ts;

        const speed = _waiting ? 0 : _pxPerSec;
        const hitY  = H - HIT_ZONE_H;

        _ctx.clearRect(0, 0, W, H);

        // Hit zone background
        _ctx.fillStyle = COLORS.zone.fill;
        _ctx.fillRect(0, hitY, W, HIT_ZONE_H);
        _ctx.fillStyle = 'rgba(255,255,255,0.06)';
        _ctx.fillRect(0, hitY, W, 1);

        // Hit zone pulse: glows when waiting for user to press
        if (_waitMode && _waiting) {
            const pulse = (Math.sin(ts * 0.005) + 1) * 0.5;
            _ctx.save();
            _ctx.globalAlpha = 0.12 + pulse * 0.20;
            _ctx.fillStyle = '#4a9eff';
            _ctx.fillRect(0, hitY, W, HIT_ZONE_H);
            _ctx.restore();
        }

        // ── Bars ──────────────────────────────────────────────────────────
        for (let i = _bars.length - 1; i >= 0; i--) {
            const b = _bars[i];
            b.y += speed * dt;

            const barBottom = b.y + b.h;

            // Performance mode: auto-advance when bar passes hit zone
            if (!_waitMode && b.state === 'falling' && b.stepIdx === _stepIdx) {
                if (barBottom >= hitY + 4) {
                    _advanceStep(b.stepIdx, false);
                }
            }

            // Wait mode: snap to hit zone and pause when current bar arrives
            if (_waitMode && !_waiting && b.state === 'falling' && b.stepIdx === _stepIdx) {
                if (barBottom >= hitY) {
                    b.y     = hitY - b.h;   // snap precisely to hit zone top
                    _waiting = true;
                }
            }

            if (b.y > H + 10) { _bars.splice(i, 1); continue; }

            // Color by state + hand (left: midi < 60, right: midi >= 60)
            let col;
            if      (b.state === 'hit')  col = COLORS.hit;
            else if (b.state === 'miss') col = COLORS.miss;
            else if (b.midi < _splitMidi) col = b.isBlack ? COLORS.leftBlack : COLORS.leftHand;
            else                          col = b.isBlack ? COLORS.black      : COLORS.white;

            const visY = Math.max(b.y, 0);
            const visH = Math.min(b.h, b.y < 0 ? b.h + b.y : b.h);
            if (visH <= 0) { _ctx.restore?.(); continue; }

            const alpha = b.y < 0 ? Math.max(0, (b.y + b.h) / b.h) : 1;

            _ctx.save();
            _ctx.globalAlpha = alpha;
            _ctx.shadowBlur  = 10;
            _ctx.shadowColor = col.glow;
            _ctx.fillStyle   = col.fill;
            _roundRect(b.x, visY, b.w, visH, 4);
            _ctx.restore();

            // Note name label (only when bar is large enough and in view)
            if (b.w >= 10 && visH >= 12 && b.state !== 'miss') {
                const label = _NOTE_NAMES[b.midi % 12];
                const fs = Math.max(8, Math.min(12, b.w * 0.38));
                _ctx.save();
                _ctx.globalAlpha = Math.min(1, alpha * 1.4);
                _ctx.shadowBlur  = 0;
                _ctx.font        = `bold ${fs}px sans-serif`;
                _ctx.fillStyle   = b.isBlack ? 'rgba(255,255,255,0.88)' : 'rgba(10,20,60,0.75)';
                _ctx.textAlign   = 'center';
                _ctx.textBaseline = 'middle';
                const labelY = Math.max(visY + fs * 0.7, visY + visH * 0.5);
                _ctx.fillText(label, b.x + b.w / 2, labelY);
                _ctx.restore();
            }
        }

        // ── Flashes ───────────────────────────────────────────────────────
        for (let i = _flashes.length - 1; i >= 0; i--) {
            const f = _flashes[i];
            f.alpha -= dt * 5;
            if (f.alpha <= 0) { _flashes.splice(i, 1); continue; }
            const col = f.correct ? COLORS.hit : COLORS.miss;
            _ctx.save();
            _ctx.globalAlpha = f.alpha * 0.7;
            _ctx.shadowBlur  = 20;
            _ctx.shadowColor = col.glow;
            _ctx.fillStyle   = col.fill;
            _roundRect(f.x, hitY - 4, f.w, HIT_ZONE_H + 4, 4);
            _ctx.restore();
        }

        // ── Particles ─────────────────────────────────────────────────────
        for (let i = _particles.length - 1; i >= 0; i--) {
            const p = _particles[i];
            p.x    += p.vx * dt;
            p.y    += p.vy * dt;
            p.vy   += 400 * dt;   // gravity
            p.alpha -= dt * 2.8;
            if (p.alpha <= 0) { _particles.splice(i, 1); continue; }
            _ctx.save();
            _ctx.globalAlpha = p.alpha;
            _ctx.fillStyle   = p.color;
            _ctx.beginPath();
            _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            _ctx.fill();
            _ctx.restore();
        }

        // ── Score popups ─────────────────────────────────────────────────
        for (let i = _popups.length - 1; i >= 0; i--) {
            const p = _popups[i];
            p.y     += p.vy * dt;
            p.alpha -= dt * 2.2;
            if (p.alpha <= 0) { _popups.splice(i, 1); continue; }
            _ctx.save();
            _ctx.globalAlpha  = p.alpha;
            _ctx.font         = 'bold 13px sans-serif';
            _ctx.fillStyle    = '#50c878';
            _ctx.textAlign    = 'center';
            _ctx.textBaseline = 'middle';
            _ctx.shadowColor  = 'rgba(80,200,120,0.7)';
            _ctx.shadowBlur   = 12;
            _ctx.fillText(p.text, p.x, p.y);
            _ctx.restore();
        }

        // Replenish bars
        if (!_waiting && _stepIdx < _steps.length) _scheduleBars();
    }

    function _roundRect(x, y, w, h, r) {
        if (!_ctx) return;
        _ctx.beginPath();
        _ctx.roundRect ? _ctx.roundRect(x, y, w, h, r) : _ctx.rect(x, y, w, h);
        _ctx.fill();
    }

    // ── Particles burst ────────────────────────────────────────────────────
    function _burst(x, w, midi) {
        const cx   = x + w / 2;
        const hitY = (_canvas?.height ?? 400) - HIT_ZONE_H;
        // Right hand → yellow/gold, Left hand → orange
        const baseColor = (midi !== undefined && midi < _splitMidi)
            ? '#ff9a40' : '#ffe066';
        const colors = [baseColor, '#ffffff', '#50c878'];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = -Math.PI * (0.2 + 0.6 * Math.random());
            const speed = 80 + Math.random() * 180;
            _particles.push({
                x: cx + (Math.random() - 0.5) * w,
                y: hitY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                r: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
    }

    // ── Note input ─────────────────────────────────────────────────────────
    function noteOn(midi) {
        _pressed.add(midi);
        if (_stepIdx >= _steps.length) return;

        const step   = _steps[_stepIdx];
        const target = Array.isArray(step.midi) ? step.midi : [step.midi];
        const correct = target.includes(midi);

        const bar = _bars.find(b => b.midi === midi && b.stepIdx === _stepIdx);
        if (bar) {
            bar.state   = correct ? 'hit' : 'miss';
            bar.hitTime = performance.now();
        }

        const info = _noteMap[midi];
        if (info) {
            _flashes.push({ x: info.xCenter - info.width / 2 + 2,
                w: info.width - 4, alpha: 1, correct });
            if (correct) {
                _burst(info.xCenter - info.width / 2, info.width, midi);
                // Floating score popup
                _popups.push({
                    x:    info.xCenter,
                    y:    (_canvas?.height ?? 400) - HIT_ZONE_H - 20,
                    vy:   -70,
                    text: '+Good!',
                    alpha: 1,
                });
            }
        }

        // Wait mode: advance when all target notes are held
        if (_waitMode && _waiting) {
            const allDown = target.every(m => _pressed.has(m));
            if (allDown) {
                _advanceStep(_stepIdx, true);
            }
        }
        // Non-wait mode: still mark bar but auto-advance is handled by _loop
    }

    function noteOff(midi) {
        _pressed.delete(midi);
    }

    // ── Step advance ───────────────────────────────────────────────────────
    function _advanceStep(idx, correct) {
        const step   = _steps[idx];
        const target = Array.isArray(step.midi) ? step.midi : [step.midi];
        const result = { stepIdx: idx, correct, midi: target };
        _results.push(result);
        _onStepComplete?.(idx, result);

        _stepIdx = idx + 1;

        if (_stepIdx >= _steps.length) {
            setTimeout(() => _onSequenceEnd?.(_results), 500);
            return;
        }

        if (_waitMode) {
            _waiting = false;   // resume falling — next bar will snap when it hits the zone
            _scheduleBars();
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────
    function start() {
        if (_animId) cancelAnimationFrame(_animId);
        _recalcSpeed();
        _lastTs  = null;
        _waiting = false;   // always start moving; wait-mode pauses ON HIT, not at init
        _animId  = requestAnimationFrame(_loop);
        _scheduleBars();
    }

    function stop() {
        if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
        _ctx?.clearRect(0, 0, _canvas?.width ?? 0, _canvas?.height ?? 0);
        _bars = []; _flashes = []; _particles = []; _popups = [];
    }

    function setWaitMode(val) {
        _waitMode = val;
        if (!val) _waiting = false;
    }

    function setNoteMap(obj) {
        _noteMap = obj || {};
        _bars.forEach(b => {
            const info = _noteMap[b.midi];
            if (!info) return;
            b.x = info.xCenter - info.width / 2 + 2;
            b.w = info.width - 4;
        });
    }

    function resize(w, h) {
        if (!_canvas) return;
        _canvas.width  = w;
        _canvas.height = h;
        _recalcSpeed();
    }

    function setSplit(midiNote) {
        _splitMidi = Math.max(0, Math.min(127, midiNote));
    }

    function setSpeedMult(mult) {
        _speedMult = Math.max(0.1, Math.min(4.0, mult));
        _recalcSpeed();
    }

    function setHandFilter(filter) {
        _handFilter = (filter === 'left' || filter === 'right') ? filter : 'both';
    }

    return {
        init, loadSequence, start, stop,
        noteOn, noteOff, setWaitMode, setNoteMap, resize,
        setSplit, setSpeedMult, setHandFilter,
        isWaitMode:     ()  => _waitMode,
        onStepComplete: cb  => { _onStepComplete = cb; },
        onSequenceEnd:  cb  => { _onSequenceEnd  = cb; },
    };
})();
