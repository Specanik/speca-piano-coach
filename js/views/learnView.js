/**
 * LearnView — full-screen lesson UI.
 *
 * Smart diff-render: only re-renders when the step index or phase changes.
 * Within-step updates (practice feedback, sequence progress) patch specific
 * DOM nodes — no piano remount, no FallingNotes restart on every note press.
 */
const LearnView = (() => {
    let _quizAnswered   = false;
    let _resultData     = null;
    let _pianoNoteMap   = {};
    let _renderedPhase  = null;
    let _renderedStep   = -1;   // stepIndex of last full render

    // ── Init ───────────────────────────────────────────────────────
    function init() {
        LessonEngine.onStateChange(state => _smartRender(state));
    }

    // ── Navigate to learn view → show lesson list ──────────────────
    function showList() {
        _renderedPhase = null; _renderedStep = -1;
        const el = document.getElementById('learn-view');
        if (el) _renderLessonList(el);
    }

    // ── Start a specific lesson ────────────────────────────────────
    function startLesson(lessonId) {
        _quizAnswered = false;
        _resultData   = null;
        _renderedPhase = null; _renderedStep = -1;
        FallingNotes.stop();
        LessonEngine.startLesson(lessonId);
    }

    // ── Smart render dispatcher ────────────────────────────────────
    function _smartRender(state) {
        const el = document.getElementById('learn-view');
        if (!el) return;

        if (state.phase === 'idle') { _renderLessonList(el); return; }
        if (state.phase === 'result') { _renderResult(el, state); return; }

        const stepChanged = state.stepIndex !== _renderedStep
            || state.phase !== _renderedPhase;

        if (stepChanged) {
            _renderedPhase = state.phase;
            _renderedStep  = state.stepIndex;
            _renderStep(el, state);
        } else {
            // Partial update — only update feedback/progress elements
            _patchStep(state);
        }
    }

    // ── Lesson list ────────────────────────────────────────────────
    function _renderLessonList(el) {
        const lessons  = LessonsData.getAll();
        const progress = ProgressStore.getProgress();

        el.innerHTML = `
            <div class="lv-header">
                <span style="font-size:1.3rem">🎹</span>
                <span class="lv-title">Tất cả bài học</span>
            </div>
            <div class="lv-lesson-list">
                ${lessons.map((l, i) => {
                    const r = progress.completedLessons[l.id];
                    const stars = r?.stars || 0;
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
                                    <span class="s-earned">${'★'.repeat(stars)}</span>
                                    <span class="s-empty">${'☆'.repeat(3 - stars)}</span>
                                </div>
                            </div>
                        </button>`;
                }).join('')}
            </div>`;

        el.querySelectorAll('.lv-lesson-card').forEach(card => {
            card.addEventListener('click', () => startLesson(card.dataset.id));
        });
    }

    // ── Full step render (only on step change) ─────────────────────
    function _renderStep(el, state) {
        const step = state.step;
        if (!step) return;

        const badgeLabels = { theory:'📖 Lý thuyết', practice:'🎹 Luyện ngón', play:'🎵 Ghép nhạc', quiz:'❓ Kiểm tra' };
        const isLast = state.stepIndex >= state.totalSteps - 1;

        const stepDots = Array.from({ length: state.totalSteps }, (_, i) =>
            `<div class="lv-step-seg ${i < state.stepIndex ? 'done' : i === state.stepIndex ? 'current' : ''}"></div>`
        ).join('');

        el.innerHTML = `
            <div class="lv-header">
                <button class="lv-back-btn" id="lv-back">←</button>
                <span class="lv-title">${state.lessonTitle || ''}</span>
                <button class="lv-close-btn" id="lv-close">✕</button>
            </div>
            <div class="lv-step-bar">${stepDots}</div>
            <div class="lv-step-badge lv-badge-${step.type}">${badgeLabels[step.type] || step.type}</div>
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

        const content = document.getElementById('lv-step-content');
        if (content) _renderStepContent(content, state);

        document.getElementById('lv-back')
            ?.addEventListener('click', () => { FallingNotes.stop(); showList(); });
        document.getElementById('lv-close')
            ?.addEventListener('click', () => { FallingNotes.stop(); Router.go('home'); setTimeout(() => HomeView.render(), 100); });
        document.getElementById('lv-prev')
            ?.addEventListener('click', () => { FallingNotes.stop(); _renderedStep = -1; LessonEngine.prevStep(); });
        document.getElementById('lv-next')
            ?.addEventListener('click', () => {
                FallingNotes.stop();
                if (isLast) {
                    const summary = LessonEngine.endLesson();
                    _handleEnd(state.lessonId, summary);
                } else {
                    _quizAnswered = false;
                    _renderedStep = -1;
                    LessonEngine.nextStep();
                }
            });
    }

    // ── Partial patch (same step, data changed) ────────────────────
    function _patchStep(state) {
        const step = state.step;
        if (!step) return;

        if (step.type === 'practice') {
            const last = state.attempts[state.attempts.length - 1];
            const fb = document.getElementById('lv-prac-feedback');
            if (fb && last) {
                const ok = last.score >= 65;
                fb.className = `lv-feedback ${ok ? 'correct' : 'wrong'}`;
                fb.textContent = ok
                    ? `✅ ${Scorer.gradeLabel(last.score)} — ${last.score}/100`
                    : '❌ Thử lại — nhớ nhấn đúng nốt';

                // Enable Next button once correct
                if (ok) {
                    const btn = document.getElementById('lv-next');
                    if (btn) btn.disabled = false;
                }
            }
        }

        if (step.type === 'play') {
            // Update sequence dots without re-mounting piano or restarting FallingNotes
            const idx  = state.sequenceIdx;
            const seq  = step.sequence || [];
            const dots = document.querySelectorAll('.lv-seq-dot');
            dots.forEach((d, i) => {
                d.className = `lv-seq-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}`;
            });
            const txt = document.querySelector('.lv-seq-progress-text');
            if (txt) txt.textContent = `${idx}/${seq.length}`;

            // Update FallingNotes for current step
            if (idx < seq.length) {
                const next = Array.isArray(seq[idx].midi) ? seq[idx].midi : [seq[idx].midi];
                NoteHighlighter.setTarget(next);
                NoteHighlighter.showTargetHints();
            }

            // Enable Next when sequence done
            if (idx >= seq.length) {
                const btn = document.getElementById('lv-next');
                if (btn) btn.disabled = false;
            }
        }
    }

    // ── Step content render ────────────────────────────────────────
    function _renderStepContent(container, state) {
        switch (state.step.type) {
            case 'theory':   _renderTheory(container, state.step);          break;
            case 'practice': _renderPractice(container, state.step, state); break;
            case 'play':     _renderPlay(container, state.step, state);     break;
            case 'quiz':     _renderQuiz(container, state.step, state);     break;
        }
    }

    // ── Theory step — visual card format via TheoryRenderer ──────
    function _renderTheory(container, step) {
        const enhanced = (typeof TheoryRenderer !== 'undefined')
            ? TheoryRenderer.enhance(step.content || '', step)
            : step.content || '';

        container.innerHTML = `
            <div class="lv-theory">
                <h2 class="lv-theory-heading">${step.title}</h2>
                <div class="lv-theory-body theory-visual-body">${enhanced}</div>
            </div>`;

        // Bind interactive events (play buttons, key clicks)
        if (typeof TheoryRenderer !== 'undefined') {
            TheoryRenderer.bindEvents(container.querySelector('.lv-theory-body'));
        }
    }

    // ── Practice step ──────────────────────────────────────────────
    function _renderPractice(container, step, state) {
        const last = state.attempts[state.attempts.length - 1];
        const fbClass = last ? (last.score >= 65 ? 'correct' : 'wrong') : 'waiting';
        const fbMsg   = last
            ? (last.score >= 65 ? `✅ ${Scorer.gradeLabel(last.score)} — ${last.score}/100` : '❌ Thử lại')
            : '🎹 Nhấn các phím được tô sáng';

        container.innerHTML = `
            <div class="lv-practice">
                <div class="lv-practice-instruction">${step.content || ''}</div>
                ${step.hint ? `<div class="lv-practice-hint">💡 ${step.hint}</div>` : ''}
                <div class="lv-feedback ${fbClass}" id="lv-prac-feedback">${fbMsg}</div>
                <div class="lv-piano-area" id="lv-piano-practice" style="flex:1;min-height:0"></div>
            </div>`;

        _mountPiano('lv-piano-practice', '36');

        const targets = Array.isArray(step.notes?.[0]) ? step.notes[0] : (step.notes || []);
        NoteHighlighter.setTarget(targets);
        NoteHighlighter.showTargetHints();
    }

    // ── Play step (falling notes) ──────────────────────────────────
    function _renderPlay(container, step, state) {
        const seq  = step.sequence || [];
        const bpm  = step.bpm || 70;
        const idx  = state.sequenceIdx;

        const dotCount = Math.min(seq.length, 20);
        const dots = Array.from({ length: dotCount }, (_, i) =>
            `<div class="lv-seq-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}"></div>`
        ).join('');

        container.innerHTML = `
            <div class="lv-play">
                <div class="lv-play-controls">
                    <button class="lv-play-mode-btn ${_waitMode ? 'active' : ''}" id="wait-mode-btn">
                        ⏸ Chờ nốt đúng
                    </button>
                    <span class="lv-bpm-display">♩= ${bpm} BPM</span>
                </div>
                <div class="lv-seq-progress">
                    ${dots}
                    <span class="lv-seq-progress-text">${idx}/${seq.length}</span>
                </div>
                <div id="lv-falling-area" style="flex:1;min-height:0;position:relative;background:rgba(0,0,0,0.4)">
                    <canvas id="falling-canvas-lv" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
                </div>
                <div id="lv-piano-play" style="height:210px;flex-shrink:0;overflow:hidden;
                    display:flex;align-items:center;justify-content:center;background:rgba(10,10,20,0.8)">
                </div>
            </div>`;

        document.getElementById('wait-mode-btn')?.addEventListener('click', e => {
            _waitMode = !_waitMode;
            e.currentTarget.classList.toggle('active', _waitMode);
            FallingNotes.setWaitMode(_waitMode);
        });

        // Mount piano
        _mountPiano('lv-piano-play', '36');

        // Init falling notes
        const area   = document.getElementById('lv-falling-area');
        const canvas = document.getElementById('falling-canvas-lv');
        if (canvas && area) {
            // Use ResizeObserver for correct sizing
            const setSize = () => {
                canvas.width  = area.clientWidth  || 400;
                canvas.height = area.clientHeight || 180;
            };
            setSize();
            new ResizeObserver(setSize).observe(area);

            FallingNotes.init(canvas, _pianoNoteMap);
            FallingNotes.setWaitMode(_waitMode);
            FallingNotes.loadSequence(seq, bpm);

            FallingNotes.onSequenceEnd(() => {
                const btn = document.getElementById('lv-next');
                if (btn) btn.disabled = false;
            });

            FallingNotes.start();
        }

        // Set first target
        if (seq.length > 0) {
            const first = Array.isArray(seq[0].midi) ? seq[0].midi : [seq[0].midi];
            NoteHighlighter.setTarget(first);
            NoteHighlighter.showTargetHints();
        }
    }

    let _waitMode = true;

    // ── Quiz step ──────────────────────────────────────────────────
    function _renderQuiz(container, step) {
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
    }

    function _renderResult(el, state) {
        if (!_resultData) return;
        const { summary, newBadges, lessonId } = _resultData;
        const lesson = LessonsData.getById(lessonId);
        const xpGain = lesson ? Math.round(lesson.xp * (summary.totalScore / 100)) : 0;
        const stars  = summary.stars;

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
                    <div class="lv-result-grade">${Scorer.gradeLabel(summary.totalScore)}</div>
                    <div class="lv-result-xp">⚡ +${xpGain} XP</div>
                    ${badgesHTML}
                    <div class="lv-result-actions">
                        <button class="lv-btn lv-btn-secondary" id="result-retry">🔄 Làm lại</button>
                        <button class="lv-btn lv-btn-primary"   id="result-home">🏠 Trang chủ</button>
                    </div>
                </div>
            </div>`;

        if (stars === 3) _confetti();
        AppShell?.updateStats?.();

        document.getElementById('result-retry')?.addEventListener('click', () => startLesson(lessonId));
        document.getElementById('result-home')?.addEventListener('click', () => {
            Router.go('home'); setTimeout(() => HomeView.render(), 100);
        });
    }

    // ── Piano mount helper ─────────────────────────────────────────
    function _mountPiano(containerId, layout) {
        const container = document.getElementById(containerId);
        if (!container) return;
        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render(containerId, layout);
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
        const ctx    = canvas.getContext('2d');
        const pieces = Array.from({ length: 80 }, () => ({
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
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
                ctx.fillStyle = p.color; ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
                ctx.restore();
            });
            if (++frame < 120) requestAnimationFrame(loop);
            else canvas.remove();
        };
        requestAnimationFrame(loop);
    }

    return { init, showList, startLesson };
})();
