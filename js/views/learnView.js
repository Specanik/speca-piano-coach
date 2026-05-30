/**
 * LearnView — full-screen lesson UI.
 * Replaces the old modal-based LessonUI.
 * Renders inside #learn-view, talks to LessonEngine.
 */
const LearnView = (() => {
    let _quizAnswered  = false;
    let _resultData    = null;
    let _pianoCanvas   = null;
    let _pianoNoteMap  = {};
    let _fallingActive = false;
    let _waitMode      = true;
    let _currentState  = null;

    // ── Init ───────────────────────────────────────────────────────
    function init() {
        LessonEngine.onStateChange(state => {
            _currentState = state;
            _render(state);
        });
    }

    // ── Navigate to learn view and show lesson list ────────────────
    function showList() {
        const el = document.getElementById('learn-view');
        if (!el) return;
        _renderLessonList(el);
    }

    // ── Start a specific lesson ────────────────────────────────────
    function startLesson(lessonId) {
        _quizAnswered = false;
        _resultData   = null;
        FallingNotes.stop();
        _fallingActive = false;
        LessonEngine.startLesson(lessonId);
    }

    // ── Main render dispatcher ─────────────────────────────────────
    function _render(state) {
        const el = document.getElementById('learn-view');
        if (!el) return;

        if (state.phase === 'idle') {
            _renderLessonList(el);
            return;
        }

        if (state.phase === 'result') {
            _renderResult(el, state);
            return;
        }

        _renderStep(el, state);
    }

    // ── Lesson list ────────────────────────────────────────────────
    function _renderLessonList(el) {
        const lessons = LessonsData.getAll();
        const progress = ProgressStore.getProgress();

        el.innerHTML = `
            <div class="lv-header">
                <span class="top-bar-logo-icon" style="font-size:1.3rem">🎹</span>
                <span class="lv-title">Tất cả bài học</span>
            </div>
            <div class="lv-lesson-list">
                ${lessons.map((l, i) => {
                    const r = progress.completedLessons[l.id];
                    const stars = r?.stars || 0;
                    const earned = '★'.repeat(stars);
                    const empty  = '☆'.repeat(3 - stars);
                    return `
                        <button class="lv-lesson-card ${r ? 'completed' : ''}" data-id="${l.id}">
                            <div class="lv-lesson-thumb">${l.thumbnail}</div>
                            <div class="lv-lesson-info">
                                <div class="lv-lesson-num">Bài ${i + 1}</div>
                                <div class="lv-lesson-title">${l.title}</div>
                                <div class="lv-lesson-desc">${l.description}</div>
                            </div>
                            <div class="lv-lesson-meta">
                                <div class="lv-lesson-xp">+${l.xp} XP</div>
                                <div class="lv-lesson-stars">
                                    <span class="s-earned">${earned}</span><span class="s-empty">${empty}</span>
                                </div>
                            </div>
                        </button>`;
                }).join('')}
            </div>`;

        el.querySelectorAll('.lv-lesson-card').forEach(card => {
            card.addEventListener('click', () => startLesson(card.dataset.id));
        });
    }

    // ── Active step ────────────────────────────────────────────────
    function _renderStep(el, state) {
        const step = state.step;
        if (!step) return;

        const badgeClass  = `lv-badge-${step.type}`;
        const badgeLabels = {
            theory:   '📖 Lý thuyết',
            practice: '🎹 Luyện ngón',
            play:     '🎵 Ghép nhạc',
            quiz:     '❓ Kiểm tra'
        };

        const stepDots = Array.from({ length: state.totalSteps }, (_, i) => {
            const cls = i < state.stepIndex ? 'done' : i === state.stepIndex ? 'current' : '';
            return `<div class="lv-step-seg ${cls}"></div>`;
        }).join('');

        const isLast = state.stepIndex >= state.totalSteps - 1;

        el.innerHTML = `
            <div class="lv-header">
                <button class="lv-back-btn" id="lv-back">←</button>
                <span class="lv-title">${state.lessonTitle || ''}</span>
                <button class="lv-close-btn" id="lv-close">✕</button>
            </div>
            <div class="lv-step-bar">${stepDots}</div>
            <div class="lv-step-badge ${badgeClass}">${badgeLabels[step.type] || step.type}</div>
            <div class="lv-content" id="lv-step-content"></div>
            <div class="lv-nav" id="lv-nav">
                ${state.stepIndex > 0
                    ? `<button class="lv-btn lv-btn-secondary" id="lv-prev">← Trước</button>`
                    : ''}
                <button class="lv-btn lv-btn-primary" id="lv-next"
                    ${step.type === 'quiz' && !_quizAnswered ? 'disabled' : ''}>
                    ${isLast ? 'Hoàn thành 🎉' : 'Tiếp theo →'}
                </button>
            </div>`;

        // Render step content
        const content = document.getElementById('lv-step-content');
        if (content) _renderStepContent(content, state);

        // Events
        document.getElementById('lv-back')
            ?.addEventListener('click', () => {
                FallingNotes.stop(); _fallingActive = false;
                showList();
            });
        document.getElementById('lv-close')
            ?.addEventListener('click', () => {
                FallingNotes.stop(); _fallingActive = false;
                Router.go('home');
                setTimeout(() => HomeView.render(), 100);
            });
        document.getElementById('lv-prev')
            ?.addEventListener('click', () => { FallingNotes.stop(); LessonEngine.prevStep(); });
        document.getElementById('lv-next')
            ?.addEventListener('click', () => {
                FallingNotes.stop(); _fallingActive = false;
                if (isLast) {
                    const summary = LessonEngine.endLesson();
                    _handleEnd(state.lessonId, summary);
                } else {
                    _quizAnswered = false;
                    LessonEngine.nextStep();
                }
            });
    }

    function _renderStepContent(container, state) {
        const step = state.step;
        switch (step.type) {
            case 'theory':   _renderTheory(container, step);           break;
            case 'practice': _renderPractice(container, step, state);  break;
            case 'play':     _renderPlay(container, step, state);      break;
            case 'quiz':     _renderQuiz(container, step, state);      break;
        }
    }

    // ── Theory ────────────────────────────────────────────────────
    function _renderTheory(container, step) {
        container.innerHTML = `
            <div class="lv-theory">
                <h2 class="lv-theory-heading">${step.title}</h2>
                <div class="lv-theory-body">${step.content || ''}</div>
            </div>`;
    }

    // ── Practice ──────────────────────────────────────────────────
    function _renderPractice(container, step, state) {
        const last = state.attempts[state.attempts.length - 1];
        let feedbackClass = 'waiting';
        let feedbackMsg   = '🎹 Nhấn các phím được tô sáng';

        if (last) {
            feedbackClass = last.score >= 65 ? 'correct' : 'wrong';
            feedbackMsg   = last.score >= 65
                ? `✅ ${Scorer.gradeLabel(last.score)} — ${last.score}/100`
                : `❌ Thử lại — nhớ nhấn đúng nốt`;
        }

        container.innerHTML = `
            <div class="lv-practice">
                <div class="lv-practice-instruction">${step.content || ''}</div>
                ${step.hint ? `<div class="lv-practice-hint">💡 ${step.hint}</div>` : ''}
                <div class="lv-feedback ${feedbackClass}" id="lv-prac-feedback">${feedbackMsg}</div>
                <div class="lv-piano-area" id="lv-piano-area"></div>
            </div>`;

        _mountPiano(document.getElementById('lv-piano-area'), '36');

        // Set target highlights
        const targets = Array.isArray(step.notes[0]) ? step.notes[0] : step.notes || [];
        NoteHighlighter.setTarget(targets);
        NoteHighlighter.showTargetHints();
    }

    // ── Play ───────────────────────────────────────────────────────
    function _renderPlay(container, step, state) {
        const seq  = step.sequence || [];
        const bpm  = step.bpm || 70;

        const dotCount = Math.min(seq.length, 16);
        const seqDots  = Array.from({ length: dotCount }, (_, i) => {
            const cls = i < state.sequenceIdx ? 'done' : i === state.sequenceIdx ? 'current' : '';
            return `<div class="lv-seq-dot ${cls}"></div>`;
        }).join('');

        container.innerHTML = `
            <div class="lv-play">
                <div class="lv-play-controls">
                    <button class="lv-play-mode-btn ${_waitMode ? 'active' : ''}" id="wait-mode-btn">
                        ⏸ Chờ nốt đúng
                    </button>
                    <span class="lv-bpm-display">♩= ${bpm} BPM</span>
                </div>
                <div class="lv-seq-progress">
                    ${seqDots}
                    <span class="lv-seq-progress-text">${state.sequenceIdx}/${seq.length}</span>
                </div>
                <div class="lv-falling-area" id="lv-falling-area">
                    <canvas id="falling-canvas"></canvas>
                </div>
                <div class="lv-piano-area" id="lv-piano-area-play" style="height:220px;flex-shrink:0"></div>
            </div>`;

        // Wait mode toggle
        document.getElementById('wait-mode-btn')?.addEventListener('click', e => {
            _waitMode = !_waitMode;
            e.currentTarget.classList.toggle('active', _waitMode);
            FallingNotes.setWaitMode(_waitMode);
        });

        // Mount piano
        _mountPiano(document.getElementById('lv-piano-area-play'), '36');

        // Init falling notes
        const fallingArea = document.getElementById('lv-falling-area');
        const canvas      = document.getElementById('falling-canvas');
        if (canvas && fallingArea) {
            canvas.width  = fallingArea.clientWidth  || 400;
            canvas.height = fallingArea.clientHeight || 160;
            canvas.style.width  = '100%';
            canvas.style.height = '100%';

            FallingNotes.init(canvas, _pianoNoteMap);
            FallingNotes.setWaitMode(_waitMode);
            FallingNotes.loadSequence(seq, bpm);
            FallingNotes.start();
            _fallingActive = true;

            FallingNotes.onStepComplete((idx, result) => {
                NoteHighlighter.noteOn(result.midi[0]);
                setTimeout(() => NoteHighlighter.noteOff(result.midi[0]), 200);
            });

            FallingNotes.onSequenceEnd(() => {
                // Auto-enable Next button
                const btn = document.getElementById('lv-next');
                if (btn) btn.disabled = false;
            });
        }

        // Set first target
        if (seq.length > 0) {
            const first = Array.isArray(seq[0].midi) ? seq[0].midi : [seq[0].midi];
            NoteHighlighter.setTarget(first);
            NoteHighlighter.showTargetHints();
        }
    }

    // ── Quiz ───────────────────────────────────────────────────────
    function _renderQuiz(container, step, state) {
        const q = step.question;
        if (!q) return;

        container.innerHTML = `
            <div class="lv-quiz">
                <h2 class="lv-theory-heading">${step.title}</h2>
                <div class="lv-quiz-question">${q.text}</div>
                <div class="lv-quiz-options">
                    ${q.options.map((opt, i) => `
                        <button class="lv-quiz-option" data-index="${i}">${opt}</button>
                    `).join('')}
                </div>
                <div class="lv-quiz-explanation" id="lv-quiz-explain"></div>
            </div>`;

        container.querySelectorAll('.lv-quiz-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (_quizAnswered) return;
                const idx    = parseInt(btn.dataset.index, 10);
                const result = LessonEngine.answerQuiz(idx);
                _quizAnswered = true;

                container.querySelectorAll('.lv-quiz-option').forEach(b => {
                    b.disabled = true;
                    const i = parseInt(b.dataset.index, 10);
                    if (i === q.correct) b.classList.add('correct');
                    else if (i === idx && !result.correct) b.classList.add('wrong');
                });

                // Show explanation / enable Next
                const nextBtn = document.getElementById('lv-next');
                if (nextBtn) nextBtn.disabled = false;

                const explain = document.getElementById('lv-quiz-explain');
                if (explain) {
                    explain.textContent = result.correct
                        ? `✅ Chính xác! ${q.options[q.correct]} là đúng.`
                        : `❌ Câu trả lời đúng là: ${q.options[q.correct]}`;
                    explain.classList.add('show');
                }
            });
        });
    }

    // ── Result screen ──────────────────────────────────────────────
    function _handleEnd(lessonId, summary) {
        const { newBadges } = ProgressStore.completeLesson(lessonId, summary);
        _resultData = { summary, newBadges, lessonId };
        // LessonEngine fires 'result' phase → _render → _renderResult
    }

    function _renderResult(el, state) {
        if (!_resultData) return;
        const { summary, newBadges, lessonId } = _resultData;
        const lesson = LessonsData.getById(lessonId);
        const xpGain = lesson ? Math.round(lesson.xp * (summary.totalScore / 100)) : 0;
        const stars  = summary.stars;
        const grade  = Scorer.gradeLabel(summary.totalScore);

        const badgesHTML = newBadges.length ? `
            <div class="lv-result-badges">
                ${newBadges.map((b, i) =>
                    `<div class="lv-result-badge-chip" style="animation-delay:${0.5 + i * 0.1}s">
                        ${b.icon} ${b.name}
                    </div>`
                ).join('')}
            </div>` : '';

        el.innerHTML = `
            <div class="lv-header">
                <span class="lv-title">Kết quả bài học</span>
            </div>
            <div class="lv-content">
                <div class="lv-result">
                    <div class="lv-result-emoji">${stars === 3 ? '🎉' : stars === 2 ? '👏' : '💪'}</div>
                    <div class="lv-result-title">Bài học hoàn thành!</div>
                    <div class="lv-result-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
                    <div class="lv-result-score">${summary.totalScore}</div>
                    <div class="lv-result-grade">${grade}</div>
                    <div class="lv-result-xp">⚡ +${xpGain} XP</div>
                    ${badgesHTML}
                    <div class="lv-result-actions">
                        <button class="lv-btn lv-btn-secondary" id="result-retry">🔄 Làm lại</button>
                        <button class="lv-btn lv-btn-primary"   id="result-home">🏠 Trang chủ</button>
                    </div>
                </div>
            </div>`;

        // Confetti for 3 stars
        if (stars === 3) _confetti();

        // Update top bar stats
        AppShell?.updateStats?.();

        document.getElementById('result-retry')
            ?.addEventListener('click', () => startLesson(lessonId));
        document.getElementById('result-home')
            ?.addEventListener('click', () => {
                Router.go('home');
                setTimeout(() => HomeView.render(), 100);
            });
    }

    // ── Piano helper ───────────────────────────────────────────────
    function _mountPiano(container, layout) {
        if (!container) return;
        // Keyboard.render needs an element ID — ensure the container has one
        if (!container.id) container.id = 'lv-piano-' + Date.now();
        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render(container.id, layout);
        _pianoCanvas  = canvas;
        _pianoNoteMap = noteMap;
        Visualizer.init(canvas, noteMap);
    }

    // ── Confetti ───────────────────────────────────────────────────
    function _confetti() {
        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx     = canvas.getContext('2d');
        const pieces  = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height,
            r: Math.random() * 6 + 2,
            color: `hsl(${Math.random() * 360},80%,60%)`,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 4 + 2,
            vr: (Math.random() - 0.5) * 0.2,
            angle: Math.random() * Math.PI * 2,
        }));

        let frame = 0;
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.angle += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                ctx.restore();
            });
            frame++;
            if (frame < 120) requestAnimationFrame(loop);
            else canvas.remove();
        };
        requestAnimationFrame(loop);
    }

    return { init, showList, startLesson };
})();
