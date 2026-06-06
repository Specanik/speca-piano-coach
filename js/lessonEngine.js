/**
 * LessonEngine — state machine quản lý tiến trình bài học.
 *
 * State machine: idle → loading → theory → practice → play → quiz → result → idle
 *
 * Mỗi "Step" trong bài học có type: theory | practice | play | quiz.
 * Engine lắng nghe noteOn/noteOff từ InputRouter và chấm điểm qua Scorer.
 *
 * API:
 *   LessonEngine.startLesson(lessonId)    bắt đầu bài học
 *   LessonEngine.nextStep()               sang bước tiếp theo
 *   LessonEngine.prevStep()               quay lại bước trước
 *   LessonEngine.endLesson()              kết thúc, tính điểm tổng
 *   LessonEngine.getState()               snapshot trạng thái hiện tại
 *   LessonEngine.onStateChange(cb)        subscribe thay đổi state
 *   LessonEngine.noteOn(midi)             forward note event vào engine
 *   LessonEngine.noteOff(midi)            forward note event vào engine
 */
const LessonEngine = (() => {
    // ── Internal state ─────────────────────────────────────────────────────
    const STEP_TYPES = ['theory', 'practice', 'play', 'quiz'];

    let _lesson      = null;
    let _stepIndex   = -1;
    let _phase       = 'idle';    // idle | theory | practice | play | quiz | result
    let _attempts    = [];        // Scorer attempt results for current step
    let _sessionAttempts = [];    // all attempts in this lesson session
    let _pressedNotes = new Set();
    let _sequenceIdx  = 0;        // for 'play' steps — which note in sequence is expected
    let _stepStartMs  = 0;        // timestamp when current step started
    let _onChange     = null;

    // Debounce: prevent double-counting rapid MIDI bursts (same note, same step)
    const _DEBOUNCE_MS = window.PianoConfig?.lesson?.inputDebounceMs ?? 50;
    const _lastNoteMs  = new Map();   // key: `${stepIdx}:${midi}` → timestamp

    function _isDuplicate(midi) {
        const key = `${_stepIndex}:${midi}`;
        const now = performance.now();
        const last = _lastNoteMs.get(key) ?? 0;
        if (now - last < _DEBOUNCE_MS) return true;
        _lastNoteMs.set(key, now);
        // Keep map size bounded
        if (_lastNoteMs.size > 200) _lastNoteMs.clear();
        return false;
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function currentStep() {
        if (!_lesson || _stepIndex < 0) return null;
        return _lesson.steps[_stepIndex] || null;
    }

    function snapshot() {
        const step = currentStep();
        return {
            phase:       _phase,
            lessonId:    _lesson?.id    || null,
            lessonTitle: _lesson?.title || null,
            stepIndex:   _stepIndex,
            totalSteps:  _lesson?.steps.length || 0,
            step,
            sequenceIdx: _sequenceIdx,
            attempts:    [..._attempts],
            sessionAttempts: [..._sessionAttempts],
            pressedNotes: new Set(_pressedNotes),
        };
    }

    function emit() {
        _onChange && _onChange(snapshot());
    }

    function setPhase(phase) {
        _phase = phase;
        emit();
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────
    function startLesson(lessonId) {
        const lesson = (typeof LessonsData !== 'undefined')
            ? LessonsData.getById(lessonId)
            : null;

        if (!lesson) {
            console.error('[LessonEngine] Lesson not found:', lessonId);
            return false;
        }

        _lesson       = lesson;
        _stepIndex    = 0;
        _attempts     = [];
        _sessionAttempts = [];
        _pressedNotes = new Set();
        _sequenceIdx  = 0;

        _enterStep(0);
        return true;
    }

    function endLesson() {
        const summary = (typeof Scorer !== 'undefined')
            ? Scorer.scoreSummary(_sessionAttempts)
            : { totalScore: 0, stars: 0 };

        _phase = 'result';
        emit();
        return summary;
    }

    function nextStep() {
        if (!_lesson) return;
        const next = _stepIndex + 1;
        if (next >= _lesson.steps.length) {
            endLesson();
            return;
        }
        _enterStep(next);
    }

    function prevStep() {
        if (!_lesson || _stepIndex <= 0) return;
        _enterStep(_stepIndex - 1);
    }

    function _enterStep(index) {
        _stepIndex   = index;
        _attempts    = [];
        _sequenceIdx = 0;
        _stepStartMs = performance.now();
        _pressedNotes.clear();

        const step = currentStep();
        if (!step) return;

        _phase = step.type;   // 'theory' | 'practice' | 'play' | 'quiz'

        // Set target notes for visual highlighting
        if (typeof NoteHighlighter !== 'undefined') {
            if (step.type === 'practice') {
                const targets = _resolveNotes(step.notes);
                NoteHighlighter.setTarget(targets);
                NoteHighlighter.showTargetHints();
            } else if (step.type === 'play' && step.sequence?.length > 0) {
                const firstNote = step.sequence[0].midi;
                const targets = Array.isArray(firstNote) ? firstNote : [firstNote];
                NoteHighlighter.setTarget(targets);
                NoteHighlighter.showTargetHints();
            } else {
                NoteHighlighter.clearTarget();
            }
        }

        emit();
    }

    // ── Note events ────────────────────────────────────────────────────────
    function noteOn(midi) {
        _pressedNotes.add(midi);
        const step = currentStep();
        if (!step) return;

        if (typeof NoteHighlighter !== 'undefined') {
            NoteHighlighter.noteOn(midi);
        }

        if (step.type === 'practice') {
            if (!_isDuplicate(midi)) _checkPractice(step);
        } else if (step.type === 'play') {
            if (!_isDuplicate(midi)) _checkPlaySequence(step, midi);
        }
    }

    function noteOff(midi) {
        _pressedNotes.delete(midi);
        if (typeof NoteHighlighter !== 'undefined') {
            NoteHighlighter.noteOff(midi);
        }
    }

    // Normalize step.notes into a flat midi array regardless of nesting format.
    // Handles: [60,64,67], [[60,64,67]], undefined.
    function _resolveNotes(notes) {
        if (!notes?.length) return [];
        return Array.isArray(notes[0]) ? notes[0] : notes;
    }

    // ── Practice step logic ────────────────────────────────────────────────
    function _checkPractice(step) {
        const targetNotes = _resolveNotes(step.notes);

        if (typeof NoteHighlighter !== 'undefined' &&
            NoteHighlighter.isChordComplete(_pressedNotes)) {

            const result = (typeof Scorer !== 'undefined')
                ? Scorer.scoreAttempt({
                    targetMidi: targetNotes,
                    playedMidi: [..._pressedNotes],
                    idealTimeMs: undefined,
                    actualTimeMs: undefined
                })
                : { score: 100, stars: 3 };

            _attempts.push(result);
            _sessionAttempts.push(result);
            emit();
        }
    }

    // ── Play/sequence step logic ───────────────────────────────────────────
    function _checkPlaySequence(step, midi) {
        if (!step.sequence || _sequenceIdx >= step.sequence.length) return;

        const expected = step.sequence[_sequenceIdx];
        const targetMidi = Array.isArray(expected.midi)
            ? expected.midi
            : [expected.midi];

        const isCorrect = targetMidi.includes(midi) ||
            (Array.isArray(expected.midi) &&
                NoteHighlighter?.isChordComplete?.(_pressedNotes));

        const actualTimeMs = performance.now() - _stepStartMs;
        const idealTimeMs  = _sequenceIdx * (60000 / (step.bpm || 60));

        const result = (typeof Scorer !== 'undefined')
            ? Scorer.scoreAttempt({
                targetMidi,
                playedMidi: Array.isArray(expected.midi) ? [..._pressedNotes] : [midi],
                idealTimeMs,
                actualTimeMs,
                windowMs: (60000 / (step.bpm || 60))
            })
            : { score: isCorrect ? 100 : 0, stars: isCorrect ? 3 : 1 };

        _attempts.push(result);
        _sessionAttempts.push(result);
        _sequenceIdx++;

        // Update target for next note in sequence
        if (_sequenceIdx < step.sequence.length && typeof NoteHighlighter !== 'undefined') {
            const nextExpected = step.sequence[_sequenceIdx].midi;
            const nextTargets  = Array.isArray(nextExpected) ? nextExpected : [nextExpected];
            NoteHighlighter.setTarget(nextTargets);
            NoteHighlighter.showTargetHints();
        } else if (_sequenceIdx >= step.sequence.length) {
            // Sequence complete
            if (typeof NoteHighlighter !== 'undefined') NoteHighlighter.clearTarget();
        }

        emit();
    }

    // ── Quiz answer ────────────────────────────────────────────────────────
    function answerQuiz(selectedIndex) {
        const step = currentStep();
        if (!step || step.type !== 'quiz') return null;

        const correct = step.question.correct;
        const isRight = selectedIndex === correct;
        const result  = { score: isRight ? 100 : 0, stars: isRight ? 3 : 1,
                          noteAccuracy: 100, timingScore: 100,
                          correct: isRight, selectedIndex, correctIndex: correct };

        _attempts.push(result);
        _sessionAttempts.push(result);
        emit();
        return result;
    }

    return {
        startLesson,
        endLesson,
        nextStep,
        prevStep,
        answerQuiz,
        noteOn,
        noteOff,
        getState: snapshot,
        onStateChange: cb => { _onChange = cb; },
    };
})();
