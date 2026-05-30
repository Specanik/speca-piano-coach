/**
 * LessonUI — renders and manages the Lesson modal overlay.
 * Talks to LessonEngine for state, ProgressStore for persistence.
 *
 * Mounts a single overlay div into <body> on init.
 * The overlay is hidden/shown as needed.
 */
const LessonUI = (() => {

    let _overlay   = null;
    let _quizAnswered = false;
    let _resultData   = null;

    // ── Bootstrap ──────────────────────────────────────────────────────────
    function init() {
        _buildOverlay();
        _injectLaunchButton();
        _listenEngine();
    }

    // ── DOM construction ───────────────────────────────────────────────────
    function _buildOverlay() {
        _overlay = document.createElement('div');
        _overlay.className = 'lesson-overlay hidden';
        _overlay.innerHTML = `<div class="lesson-panel" id="lesson-panel"></div>`;
        _overlay.addEventListener('click', e => {
            if (e.target === _overlay) _closeLesson();
        });
        document.body.appendChild(_overlay);
    }

    function _injectLaunchButton() {
        // Add "Học" button to the header controls row
        const controls = document.querySelector('.controls');
        if (!controls) return;

        const row = document.createElement('div');
        row.className = 'control-row';
        row.innerHTML = `
            <span class="control-label">Học</span>
            <div style="display:flex;gap:6px;align-items:center;">
                <button class="lesson-launch-btn" id="lesson-open-btn">📚 Bài học</button>
                <button class="lesson-launch-btn" id="dashboard-open-btn" style="background:linear-gradient(135deg,#f0c040,#d09000)">🏆 Tiến trình</button>
            </div>`;
        controls.appendChild(row);

        document.getElementById('lesson-open-btn')
            ?.addEventListener('click', _showLessonList);
        document.getElementById('dashboard-open-btn')
            ?.addEventListener('click', () => DashboardUI?.show());
    }

    // ── Engine subscription ────────────────────────────────────────────────
    function _listenEngine() {
        LessonEngine.onStateChange(state => _renderState(state));

        // Forward InputRouter events into LessonEngine
        InputRouter.onNoteOn(midi => {
            LessonEngine.noteOn(midi);
            AudioEngine.startNote(midi, midi);
            Visualizer.noteOn(midi);
        });
        InputRouter.onNoteOff(midi => {
            LessonEngine.noteOff(midi);
            AudioEngine.stopNote(midi);
            Visualizer.noteOff(midi);
        });
        InputRouter.attachKeyboard();
    }

    // ── Render dispatcher ──────────────────────────────────────────────────
    function _renderState(state) {
        switch (state.phase) {
            case 'idle':   break;
            case 'result': _renderResult(state); break;
            default:       _renderStep(state);   break;
        }
    }

    // ── Lesson list ────────────────────────────────────────────────────────
    function _showLessonList() {
        const panel = document.getElementById('lesson-panel');
        if (!panel) return;

        const stats = ProgressStore.getStats();
        const lessons = LessonsData.getAll();

        panel.innerHTML = `
            <div class="lesson-home">
                <div class="lesson-home-header">
                    <span class="lesson-home-title">📚 Bài học Piano</span>
                    <button class="lesson-close-btn" id="lesson-close">✕</button>
                </div>
                <div class="lesson-stats-bar">
                    <div class="lesson-stat-chip">
                        <span class="stat-icon">⚡</span>
                        <span class="stat-value">${stats.xp} XP</span>
                    </div>
                    <div class="lesson-stat-chip">
                        <span class="stat-icon">🔥</span>
                        <span class="stat-value">${stats.streakDays} ngày liên tiếp</span>
                    </div>
                    <div class="lesson-stat-chip">
                        <span class="stat-icon">✅</span>
                        <span class="stat-value">${stats.totalCompleted}/${lessons.length} bài</span>
                    </div>
                </div>
                <div class="lesson-list">
                    ${lessons.map((l, i) => _lessonCardHTML(l, i, stats)).join('')}
                </div>
            </div>`;

        panel.querySelectorAll('.lesson-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.lessonId;
                _startLesson(id);
            });
        });

        document.getElementById('lesson-close')
            ?.addEventListener('click', _closeLesson);

        _openOverlay();
    }

    function _lessonCardHTML(lesson, index, stats) {
        const result = ProgressStore.getLessonResult(lesson.id);
        const stars  = result?.stars || 0;
        const starHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const earned   = '★'.repeat(stars);
        const empty    = '☆'.repeat(3 - stars);
        const completedClass = result ? 'completed' : '';

        return `
            <button class="lesson-card ${completedClass}" data-lesson-id="${lesson.id}">
                <div class="lesson-card-thumb">${lesson.thumbnail}</div>
                <div class="lesson-card-info">
                    <div class="lesson-card-title">${index + 1}. ${lesson.title}</div>
                    <div class="lesson-card-desc">${lesson.description}</div>
                </div>
                <div class="lesson-card-meta">
                    <div class="lesson-card-xp">+${lesson.xp} XP</div>
                    <div class="lesson-card-stars">
                        <span class="earned">${earned}</span><span>${empty}</span>
                    </div>
                </div>
            </button>`;
    }

    // ── Active lesson step ─────────────────────────────────────────────────
    function _startLesson(lessonId) {
        _quizAnswered = false;
        LessonEngine.startLesson(lessonId);
        // State change fires → _renderState → _renderStep
    }

    function _renderStep(state) {
        const panel = document.getElementById('lesson-panel');
        if (!panel || !state.step) return;

        const stepType = state.step.type;
        const badgeClass = `step-badge-${stepType}`;
        const badgeLabels = { theory: '📖 Lý thuyết', practice: '🎹 Luyện ngón', play: '🎵 Ghép nhạc', quiz: '❓ Kiểm tra' };

        panel.innerHTML = `
            <div class="lesson-active">
                <div class="lesson-active-header">
                    <button class="lesson-back-btn" id="step-back">←</button>
                    <div class="lesson-active-title">${state.lessonTitle}</div>
                    <button class="lesson-close-btn" id="step-close">✕</button>
                </div>
                <div class="lesson-step-progress">
                    ${Array.from({ length: state.totalSteps }, (_, i) => {
                        const cls = i < state.stepIndex ? 'done' : i === state.stepIndex ? 'current' : '';
                        return `<div class="lesson-step-dot ${cls}"></div>`;
                    }).join('')}
                </div>
                <div class="lesson-step-type-badge ${badgeClass}">${badgeLabels[stepType] || stepType}</div>
                <div class="lesson-step-content" id="step-content">
                    ${_stepBodyHTML(state)}
                </div>
                <div class="lesson-nav" id="lesson-nav">
                    ${_navHTML(state)}
                </div>
            </div>`;

        _bindStepEvents(state);
        _openOverlay();
    }

    function _stepBodyHTML(state) {
        const step = state.step;
        switch (step.type) {
            case 'theory':   return _theoryHTML(step);
            case 'practice': return _practiceHTML(step, state);
            case 'play':     return _playHTML(step, state);
            case 'quiz':     return _quizHTML(step);
            default:         return `<p>${step.content || ''}</p>`;
        }
    }

    function _theoryHTML(step) {
        return `
            <h2 class="lesson-step-heading">${step.title}</h2>
            <div class="lesson-theory-body">${step.content || ''}</div>`;
    }

    function _practiceHTML(step, state) {
        const lastAttempt = state.attempts[state.attempts.length - 1];
        const statusMsg   = lastAttempt
            ? `✅ ${Scorer.gradeLabel(lastAttempt.score)} — ${lastAttempt.score}điểm`
            : '';
        return `
            <h2 class="lesson-step-heading">${step.title}</h2>
            <p style="font-size:0.82rem;color:#b0c8e0;margin-bottom:8px">${step.content || ''}</p>
            ${step.hint ? `<div class="lesson-practice-hint">💡 ${step.hint}</div>` : ''}
            <div class="lesson-practice-status" id="practice-status">${statusMsg}</div>`;
    }

    function _playHTML(step, state) {
        const seq = step.sequence || [];
        const notes = seq.map((n, i) => {
            const label   = Array.isArray(n.midi) ? n.label : n.label;
            const cls     = i < state.sequenceIdx
                ? 'done'
                : i === state.sequenceIdx ? 'current' : '';
            return `<div class="lesson-seq-note ${cls}">${label}</div>`;
        }).join('');
        return `
            <h2 class="lesson-step-heading">${step.title}</h2>
            <p style="font-size:0.82rem;color:#b0c8e0;margin-bottom:8px">${step.content || ''}</p>
            <div class="lesson-sequence-display">${notes}</div>
            <p style="font-size:0.72rem;color:#6888a8;margin-top:6px">
                ${state.sequenceIdx}/${seq.length} nốt hoàn thành
            </p>`;
    }

    function _quizHTML(step) {
        const q = step.question;
        if (!q) return '';
        return `
            <h2 class="lesson-step-heading">${step.title}</h2>
            <p style="font-size:0.88rem;color:#d0e0f0;margin-bottom:14px;font-weight:600">
                ${q.text}
            </p>
            <div class="lesson-quiz-options">
                ${q.options.map((opt, i) =>
                    `<button class="lesson-quiz-option" data-index="${i}">${opt}</button>`
                ).join('')}
            </div>`;
    }

    function _navHTML(state) {
        const isFirst = state.stepIndex === 0;
        const isLast  = state.stepIndex >= state.totalSteps - 1;
        const isQuiz  = state.step?.type === 'quiz';
        const isPlay  = state.step?.type === 'play';
        const seqDone = isPlay && state.sequenceIdx >= (state.step?.sequence?.length || 0);

        let nextLabel = isLast ? 'Hoàn thành 🎉' : 'Tiếp theo →';
        let nextDisabled = '';

        // Quiz requires answering before advancing
        if (isQuiz && !_quizAnswered) nextDisabled = 'disabled';

        return `
            ${!isFirst
                ? `<button class="lesson-btn lesson-btn-secondary" id="btn-prev">← Trước</button>`
                : ''}
            <button class="lesson-btn lesson-btn-primary" id="btn-next" ${nextDisabled}>
                ${nextLabel}
            </button>`;
    }

    // ── Event binding for steps ────────────────────────────────────────────
    function _bindStepEvents(state) {
        document.getElementById('step-back')
            ?.addEventListener('click', _showLessonList);
        document.getElementById('step-close')
            ?.addEventListener('click', _closeLesson);
        document.getElementById('btn-prev')
            ?.addEventListener('click', () => LessonEngine.prevStep());
        document.getElementById('btn-next')
            ?.addEventListener('click', () => {
                if (state.stepIndex >= state.totalSteps - 1) {
                    const summary = LessonEngine.endLesson();
                    _handleLessonEnd(state.lessonId, summary);
                } else {
                    _quizAnswered = false;
                    LessonEngine.nextStep();
                }
            });

        // Quiz option buttons
        document.querySelectorAll('.lesson-quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (_quizAnswered) return;
                const idx    = parseInt(btn.dataset.index, 10);
                const result = LessonEngine.answerQuiz(idx);
                _quizAnswered = true;

                // Visual feedback
                document.querySelectorAll('.lesson-quiz-option').forEach(b => {
                    b.disabled = true;
                    const i = parseInt(b.dataset.index, 10);
                    if (i === state.step.question.correct) b.classList.add('correct');
                    else if (i === idx && !result.correct)  b.classList.add('wrong');
                });

                // Enable Next button
                const nextBtn = document.getElementById('btn-next');
                if (nextBtn) nextBtn.disabled = false;
            });
        });
    }

    // ── Result screen ──────────────────────────────────────────────────────
    function _handleLessonEnd(lessonId, summary) {
        const { data, newBadges } = ProgressStore.completeLesson(lessonId, summary);
        _resultData = { summary, newBadges, lessonId };
        // LessonEngine fires 'result' phase → _renderResult
    }

    function _renderResult(state) {
        const panel = document.getElementById('lesson-panel');
        if (!panel || !_resultData) return;

        const { summary, newBadges } = _resultData;
        const stars = summary.stars;
        const starHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        const grade = Scorer.gradeLabel(summary.totalScore);
        const lesson = LessonsData.getById(state.lessonId);
        const xpGain = lesson
            ? Math.round(lesson.xp * (summary.totalScore / 100))
            : 0;

        const badgesHTML = newBadges.length
            ? `<div style="font-size:0.78rem;color:#9ab8d8;margin-bottom:6px">🎖️ Huy hiệu mới!</div>
               <div class="lesson-new-badges">
                   ${newBadges.map(b =>
                       `<div class="badge-chip">${b.icon} ${b.name}</div>`
                   ).join('')}
               </div>`
            : '';

        panel.innerHTML = `
            <div class="lesson-result">
                <div class="lesson-result-emoji">${stars === 3 ? '🎉' : stars === 2 ? '👏' : '💪'}</div>
                <div class="lesson-result-title">Bài học hoàn thành!</div>
                <div class="lesson-result-stars">${starHTML}</div>
                <div class="lesson-result-score">${summary.totalScore}</div>
                <div class="lesson-result-label">${grade}</div>
                <div class="lesson-result-xp">+${xpGain} XP</div>
                ${badgesHTML}
                <div style="display:flex;gap:10px;width:100%;margin-top:8px">
                    <button class="lesson-btn lesson-btn-secondary" id="result-retry">🔄 Làm lại</button>
                    <button class="lesson-btn lesson-btn-primary"   id="result-list">📚 Bài khác</button>
                </div>
            </div>`;

        document.getElementById('result-retry')
            ?.addEventListener('click', () => _startLesson(state.lessonId));
        document.getElementById('result-list')
            ?.addEventListener('click', _showLessonList);
    }

    // ── Overlay helpers ────────────────────────────────────────────────────
    function _openOverlay()  { _overlay?.classList.remove('hidden'); }
    function _closeLesson()  {
        _overlay?.classList.add('hidden');
        NoteHighlighter?.clearTarget();
    }

    return { init };
})();
