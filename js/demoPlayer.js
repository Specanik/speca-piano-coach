/**
 * DemoPlayer — phát thử bài nhạc với highlight phím piano.
 *
 * Dùng AudioEngine để phát âm và highlight phím trong DOM.
 * Hoạt động trong cả lesson view lẫn practice view.
 *
 * API:
 *   DemoPlayer.playSequence(sequence, bpm, opts)  phát chuỗi nốt
 *   DemoPlayer.playNotes(midis, durationMs)        phát hợp âm ngay lập tức
 *   DemoPlayer.stop()                              dừng ngay
 *   DemoPlayer.isPlaying()                         đang phát không?
 *
 * opts = { onStart, onDone, onNote, btnEl, bpmScale }
 *   btnEl    : button sẽ đổi text thành "⏹ Dừng" khi đang phát
 *   bpmScale : nhân hệ số BPM (1.0 = gốc, 1.5 = nhanh hơn 50%)
 */
const DemoPlayer = (() => {
    let _timers  = [];
    let _playing = false;
    let _btnEl   = null;    // button hiện tại để restore sau khi xong
    let _btnText = '';

    // ── DOM helpers ───────────────────────────────────────────────────
    function _pianoKeys(midi) {
        // Prefer active view; fall back to any visible piano
        const active = document.querySelector('.view-active');
        const scope  = active || document;
        const found  = scope.querySelectorAll(`.piano [data-midi="${midi}"]`);
        return found.length ? [...found] : [...document.querySelectorAll(`.piano [data-midi="${midi}"]`)];
    }

    function _flashOn(midis) {
        midis.forEach(m => {
            _pianoKeys(m).forEach(el => el.classList.add('demo-playing'));
        });
    }

    function _flashOff(midis) {
        midis.forEach(m => {
            _pianoKeys(m).forEach(el => el.classList.remove('demo-playing'));
        });
    }

    // ── Audio helpers ─────────────────────────────────────────────────
    function _playNote(midi, idx) {
        if (typeof AudioEngine !== 'undefined') {
            AudioEngine.startNote(`demo_${idx}_${midi}`, midi);
        }
    }

    function _stopNote(midi, idx) {
        if (typeof AudioEngine !== 'undefined') {
            AudioEngine.stopNote(`demo_${idx}_${midi}`);
        }
    }

    // ── Button state ──────────────────────────────────────────────────
    function _setBtnPlaying(btn, playing) {
        if (!btn) return;
        if (playing) {
            _btnText = btn.textContent;
            btn.textContent = '⏹ Dừng';
            btn.classList.add('demo-btn-playing');
        } else {
            btn.textContent = _btnText || '🎵 Nghe mẫu';
            btn.classList.remove('demo-btn-playing');
        }
    }

    // ── Public API ────────────────────────────────────────────────────

    /**
     * Phát chuỗi nốt (từ lesson sequence/preview).
     * @param {Array<{midi: number|number[]}>} sequence
     * @param {number} bpm
     * @param {object} opts
     */
    function playSequence(sequence, bpm = 70, opts = {}) {
        const { onStart, onDone, onNote, btnEl, bpmScale = 1 } = opts;

        // Nếu đang phát và cùng một button → stop (toggle)
        if (_playing && btnEl && btnEl === _btnEl) {
            stop();
            return;
        }

        stop();
        _playing = true;
        _btnEl   = btnEl || null;
        _setBtnPlaying(_btnEl, true);
        onStart && onStart();

        const effectiveBpm = bpm * bpmScale;
        const beatMs  = 60000 / effectiveBpm;
        const noteLen = Math.min(beatMs * 0.78, 500);

        sequence.forEach((step, i) => {
            const midis = Array.isArray(step.midi) ? step.midi : [step.midi];

            const t1 = setTimeout(() => {
                _flashOn(midis);
                midis.forEach(m => _playNote(m, i));
                onNote && onNote(midis, true, i);
            }, i * beatMs);

            const t2 = setTimeout(() => {
                _flashOff(midis);
                midis.forEach(m => _stopNote(m, i));
                onNote && onNote(midis, false, i);
            }, i * beatMs + noteLen);

            _timers.push(t1, t2);
        });

        const total = (sequence.length - 1) * beatMs + noteLen + 300;
        const t3 = setTimeout(() => {
            _cleanup();
            onDone && onDone();
        }, total);
        _timers.push(t3);
    }

    /**
     * Phát ngay một hoặc nhiều nốt (ví dụ hợp âm trong lý thuyết).
     */
    function playNotes(midis, durationMs = 700) {
        midis = Array.isArray(midis) ? midis : [midis];
        _flashOn(midis);
        midis.forEach((m, i) => _playNote(m, 9000 + i));

        const t = setTimeout(() => {
            _flashOff(midis);
            midis.forEach((m, i) => _stopNote(m, 9000 + i));
        }, durationMs);
        _timers.push(t);
    }

    function stop() {
        _timers.forEach(clearTimeout);
        _timers = [];
        document.querySelectorAll('.demo-playing').forEach(el => el.classList.remove('demo-playing'));
        _cleanup();
    }

    function _cleanup() {
        _playing = false;
        _setBtnPlaying(_btnEl, false);
        _btnEl  = null;
        _btnText = '';
    }

    function isPlaying() { return _playing; }

    /**
     * Lấy sequence preview từ một lesson (tối đa maxNotes nốt đầu).
     */
    function getLessonPreview(lesson, maxNotes = 10) {
        if (!lesson?.steps) return null;
        const playStep = lesson.steps.find(s => s.type === 'play');
        if (playStep?.sequence?.length) {
            return playStep.sequence.slice(0, maxNotes);
        }
        // Fallback: dùng notes từ practice step
        const pracStep = lesson.steps.find(s => s.type === 'practice');
        if (pracStep?.notes) {
            const notes = Array.isArray(pracStep.notes[0])
                ? pracStep.notes.flat()
                : (pracStep.notes || []);
            return notes.slice(0, maxNotes).map(m => ({ midi: m }));
        }
        return null;
    }

    return { playSequence, playNotes, stop, isPlaying, getLessonPreview };
})();
