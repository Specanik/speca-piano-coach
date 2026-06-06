/**
 * LearnView — full-screen lesson UI.
 *
 * Smart diff-render: only re-renders when the step index or phase changes.
 * Within-step updates (practice feedback, sequence progress) patch specific
 * DOM nodes — no piano remount, no FallingNotes restart on every note press.
 */
const LearnView = (() => {
    let _quizAnswered    = false;
    let _resultData      = null;
    let _pianoNoteMap    = {};
    let _pianoTotalWidth = 0;   // keyboard's native pixel width (for falling notes alignment)
    let _renderedPhase   = null;
    let _renderedStep    = -1;  // stepIndex of last full render
    let _stepKbHandler   = null; // Space/Enter shortcut — cleaned up on each new step

    // Play-step preferences (persist across lessons)
    let _waitMode         = true;
    let _currentSpeedMult = 1.0;
    let _currentHand      = 'both';

    // ── Init ───────────────────────────────────────────────────────
    function init() {
        LessonEngine.onStateChange(state => _smartRender(state));
    }

    // ── Navigate to learn view → show lesson list ──────────────────
    function showList() {
        _renderedPhase = null; _renderedStep = -1;
        // Clean up step keyboard shortcut when leaving lesson
        if (_stepKbHandler) {
            document.removeEventListener('keydown', _stepKbHandler);
            _stepKbHandler = null;
        }
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
                <div class="lv-header-spacer"></div>
                ${_midiStatusHTML()}
            </div>
            <div class="lv-lesson-list">
                ${lessons.map((l, i) => {
                    const r     = progress.completedLessons[l.id];
                    const stars = r?.stars || 0;
                    const hasPreview = !!DemoPlayer.getLessonPreview(l, 4);
                    return `
                        <div class="lv-lesson-row">
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
                            </button>
                            ${hasPreview ? `
                            <button class="lv-preview-btn" data-id="${l.id}" title="Nghe thử bài này">
                                ▶
                            </button>` : ''}
                        </div>`;
                }).join('')}
            </div>`;

        // Start lesson on card click
        el.querySelectorAll('.lv-lesson-card').forEach(card => {
            card.addEventListener('click', () => startLesson(card.dataset.id));
        });

        // Preview button: play first few notes
        el.querySelectorAll('.lv-preview-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const lesson = LessonsData.getById(btn.dataset.id);
                if (!lesson) return;
                const preview = DemoPlayer.getLessonPreview(lesson, 10);
                if (!preview) return;
                const playStep = lesson.steps?.find(s => s.type === 'play');
                const bpm = playStep?.bpm || 70;
                DemoPlayer.playSequence(preview, bpm, { btnEl: btn, bpmScale: 1.2 });
            });
        });

        // MIDI connect button in list header
        _bindMidiBtn(el);
    }

    // ── MIDI status helpers ────────────────────────────────────────
    function _midiStatusHTML() {
        const st = (typeof InputRouter !== 'undefined') ? InputRouter.getState() : {};
        const on = st.midi && st.midiDevices?.length;
        const label = on ? (st.midiDevices[0].name.split(' ')[0]) : 'MIDI';
        return `<button class="lv-midi-status ${on ? 'connected' : ''}" id="lv-midi-btn"
                    title="${on ? 'MIDI đã kết nối — nhấn để ngắt' : 'Nhấn để kết nối MIDI'}">
                    <span class="lv-midi-dot"></span>
                    <span class="lv-midi-label">${label}</span>
                </button>`;
    }

    function _bindMidiBtn(container) {
        container.querySelector('#lv-midi-btn')?.addEventListener('click', async () => {
            if (typeof InputRouter === 'undefined') return;
            const st = InputRouter.getState();
            if (st.midi) {
                InputRouter.disableMidi();
            } else {
                if (!navigator.requestMIDIAccess) {
                    alert('Trình duyệt không hỗ trợ Web MIDI. Dùng Chrome hoặc Edge.');
                    return;
                }
                await InputRouter.enableMidi();
            }
            // Re-render header section to update indicator
            const btn = container.querySelector('#lv-midi-btn');
            if (btn) {
                const st2 = InputRouter.getState();
                const on  = st2.midi && st2.midiDevices?.length;
                btn.className = `lv-midi-status ${on ? 'connected' : ''}`;
                btn.querySelector('.lv-midi-label').textContent = on
                    ? st2.midiDevices[0].name.split(' ')[0] : 'MIDI';
                btn.title = on ? 'MIDI đã kết nối — nhấn để ngắt' : 'Nhấn để kết nối MIDI';
            }
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
                <div class="lv-header-spacer"></div>
                ${_midiStatusHTML()}
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
            ?.addEventListener('click', () => { FallingNotes.stop(); DemoPlayer.stop(); showList(); });
        document.getElementById('lv-close')
            ?.addEventListener('click', () => { FallingNotes.stop(); DemoPlayer.stop(); Router.go('home'); requestAnimationFrame(() => HomeView.render()); });
        _bindMidiBtn(el);
        document.getElementById('lv-prev')
            ?.addEventListener('click', () => { FallingNotes.stop(); DemoPlayer.stop(); _renderedStep = -1; LessonEngine.prevStep(); });

        const _nextFn = () => {
            const btn = document.getElementById('lv-next');
            if (btn && !btn.disabled) btn.click();
        };

        document.getElementById('lv-next')
            ?.addEventListener('click', () => {
                FallingNotes.stop();
                DemoPlayer.stop();
                if (isLast) {
                    const summary = LessonEngine.endLesson();
                    _handleEnd(state.lessonId, summary);
                } else {
                    _quizAnswered = false;
                    _renderedStep = -1;
                    LessonEngine.nextStep();
                }
            });

        // Space/Enter advance shortcut — remove previous, register fresh each step
        if (_stepKbHandler) document.removeEventListener('keydown', _stepKbHandler);
        _stepKbHandler = e => {
            if (e.key === ' ' || e.key === 'Enter') {
                const tag = e.target?.tagName;
                if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
                e.preventDefault();
                _nextFn();
            }
        };
        document.addEventListener('keydown', _stepKbHandler);
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

        const targets = Array.isArray(step.notes?.[0]) ? step.notes[0] : (step.notes || []);

        container.innerHTML = `
            <div class="lv-practice">
                <div class="lv-practice-instruction">${step.content || ''}</div>
                ${step.hint ? `<div class="lv-practice-hint">💡 ${step.hint}</div>` : ''}
                <div class="lv-practice-toolbar">
                    ${targets.length ? `
                    <button class="lv-demo-btn" id="lv-prac-demo">
                        🔊 Nghe nốt mẫu
                    </button>` : ''}
                </div>
                <div class="lv-feedback ${fbClass}" id="lv-prac-feedback">${fbMsg}</div>
                <div class="lv-piano-area" id="lv-piano-practice" style="flex:1;min-height:0"></div>
            </div>`;

        _mountPiano('lv-piano-practice', '36');
        NoteHighlighter.setTarget(targets);
        NoteHighlighter.showTargetHints();

        // Demo: nghe nốt mẫu
        document.getElementById('lv-prac-demo')?.addEventListener('click', () => {
            DemoPlayer.playNotes(targets, 900);
        });
    }

    // ── Play step (Simply Piano-style falling notes) ───────────────
    function _renderPlay(container, step, state) {
        const seq = step.sequence || [];
        const bpm = step.bpm || 70;
        const effectiveBpm = () => Math.round(bpm * _currentSpeedMult);

        const idx      = state.sequenceIdx;
        const dotCount = Math.min(seq.length, 24);
        const dots = Array.from({ length: dotCount }, (_, i) =>
            `<div class="lv-seq-dot ${i < idx ? 'done' : i === idx ? 'current' : ''}"></div>`
        ).join('');

        container.innerHTML = `
            <div class="lv-play">

                <!-- Simply Piano-style top control bar -->
                <div class="lv-play-topbar">
                    <div class="lv-ctrl-seg" id="lv-speed-group" title="Tốc độ luyện tập">
                        ${[['0.5','50%'],['0.75','75%'],['1','100%']].map(([m,l]) =>
                            `<button class="lv-ctrl-seg-btn${_currentSpeedMult == m ? ' active' : ''}" data-mult="${m}">${l}</button>`
                        ).join('')}
                    </div>
                    <div class="lv-ctrl-sep"></div>
                    <div class="lv-ctrl-seg" id="lv-hand-group" title="Chọn tay luyện">
                        <button class="lv-ctrl-seg-btn${_currentHand === 'left'  ? ' active' : ''}" data-hand="left"  title="Tay trái">✋</button>
                        <button class="lv-ctrl-seg-btn${_currentHand === 'both'  ? ' active' : ''}" data-hand="both"  title="Cả hai tay">🎹</button>
                        <button class="lv-ctrl-seg-btn${_currentHand === 'right' ? ' active' : ''}" data-hand="right" title="Tay phải">🤚</button>
                    </div>
                    <div class="lv-ctrl-sep"></div>
                    <button class="lv-ctrl-tog${_waitMode ? ' active' : ''}" id="lv-wait-btn" title="Chờ bấm đúng mới tiếp tục">⏸</button>
                    <button class="lv-demo-btn" id="lv-play-demo" title="Nghe mẫu">👁</button>
                    <span class="lv-bpm-label">♩ <span id="lv-bpm-num">${effectiveBpm()}</span></span>
                    <select class="lv-voice-select" id="lv-voice-sel" title="Âm thanh" style="margin-left:auto">
                        ${AudioEngine.getVoices().map(v =>
                            `<option value="${v.id}"${v.id === AudioEngine.getVoice() ? ' selected' : ''}>${v.label}</option>`
                        ).join('')}
                    </select>
                </div>

                <!-- Progress dots -->
                <div class="lv-seq-progress">
                    ${dots}
                    <span class="lv-seq-progress-text">${idx}/${seq.length}</span>
                </div>

                <!-- Falling notes canvas -->
                <div class="lv-falling-area" id="lv-falling-area">
                    <div class="lv-countdown-overlay" id="lv-countdown-overlay">
                        <div class="lv-countdown-num" id="lv-countdown-num">4</div>
                    </div>
                    <canvas id="falling-canvas-lv"></canvas>
                </div>

                <!-- Piano keyboard -->
                <div class="lv-piano-play-area" id="lv-piano-play"></div>

            </div>`;

        // ── Wire controls ──────────────────────────────────────────────────
        document.getElementById('lv-speed-group')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-mult]');
            if (!btn) return;
            _currentSpeedMult = parseFloat(btn.dataset.mult);
            document.querySelectorAll('#lv-speed-group .lv-ctrl-seg-btn')
                .forEach(b => b.classList.toggle('active', b === btn));
            document.getElementById('lv-bpm-num').textContent = effectiveBpm();
            _restartFalling(seq, effectiveBpm());
        });

        document.getElementById('lv-hand-group')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-hand]');
            if (!btn) return;
            _currentHand = btn.dataset.hand;
            document.querySelectorAll('#lv-hand-group .lv-ctrl-seg-btn')
                .forEach(b => b.classList.toggle('active', b === btn));
            FallingNotes.setHandFilter(_currentHand);
            _restartFalling(seq, effectiveBpm());
        });

        document.getElementById('lv-wait-btn')?.addEventListener('click', e => {
            _waitMode = !_waitMode;
            e.currentTarget.classList.toggle('active', _waitMode);
            FallingNotes.setWaitMode(_waitMode);
        });

        document.getElementById('lv-voice-sel')?.addEventListener('change', e => {
            AudioEngine.setVoice(e.target.value);
        });

        const demoBtn = document.getElementById('lv-play-demo');
        demoBtn?.addEventListener('click', () => {
            DemoPlayer.playSequence(seq, Math.round(bpm * 0.9), {
                btnEl: demoBtn, bpmScale: 1,
            });
        });

        // ── Init piano + FallingNotes after layout ─────────────────────────
        requestAnimationFrame(() => {
            const area   = document.getElementById('lv-falling-area');
            const canvas = document.getElementById('falling-canvas-lv');
            if (!canvas || !area) return;

            _mountPiano('lv-piano-play', '36');

            // Canvas width = keyboard pixel width (no offset needed).
            // overflow:hidden on lv-falling-area clips to container width,
            // same as piano container — so bars align with visible keys perfectly.
            const W = _pianoTotalWidth || 840;
            const H = Math.max(60, area.clientHeight || 240);

            canvas.width  = W;
            canvas.height = H;
            canvas.style.cssText = `position:absolute; top:0; left:50%; transform:translateX(-50%); width:${W}px; height:${H}px;`;

            FallingNotes.setHandFilter(_currentHand);
            FallingNotes.init(canvas, _pianoNoteMap);
            FallingNotes.setWaitMode(_waitMode);
            FallingNotes.loadSequence(seq, effectiveBpm());

            FallingNotes.onSequenceEnd(() => {
                const btn = document.getElementById('lv-next');
                if (btn) btn.disabled = false;
            });

            FallingNotes.start();

            // Resize: only update height (width is fixed = keyboard width)
            new ResizeObserver(() => {
                const h = Math.max(60, area.clientHeight || H);
                canvas.height = h;
                canvas.style.height = h + 'px';
                FallingNotes.resize(W, h);
            }).observe(area);

            // Set first target highlight
            if (seq.length > 0) {
                const first = Array.isArray(seq[0].midi) ? seq[0].midi : [seq[0].midi];
                NoteHighlighter.setTarget(first);
                NoteHighlighter.showTargetHints();
            }

            // Countdown overlay before interaction
            _runCountdown(effectiveBpm());
        });
    }

    // Restart FallingNotes with new BPM/hand (no countdown, no canvas resize)
    function _restartFalling(seq, bpm) {
        FallingNotes.setHandFilter(_currentHand);
        FallingNotes.stop();
        FallingNotes.loadSequence(seq, bpm);
        FallingNotes.start();
    }

    // Countdown overlay: 4-3-2-1 before play starts
    function _runCountdown(bpm) {
        const beatMs  = Math.round(60000 / Math.max(bpm, 40));
        const overlay = document.getElementById('lv-countdown-overlay');
        const numEl   = document.getElementById('lv-countdown-num');
        if (!overlay || !numEl) return;

        let count = 4;
        const tick = () => {
            if (!document.getElementById('lv-countdown-overlay')) return;
            if (count > 0) {
                numEl.textContent = String(count);
                numEl.classList.remove('lv-countdown-pop');
                void numEl.offsetWidth;
                numEl.classList.add('lv-countdown-pop');
                count--;
                setTimeout(tick, beatMs);
            } else {
                overlay.style.transition = 'opacity 0.3s ease';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.classList.add('sp-hidden'), 320);
            }
        };
        tick();
    }

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
            Router.go('home'); requestAnimationFrame(() => HomeView.render());
        });
    }

    // ── Piano mount helper ─────────────────────────────────────────
    function _mountPiano(containerId, layout) {
        const container = document.getElementById(containerId);
        if (!container) return;
        Visualizer.destroy();
        const { canvas, noteMap } = Keyboard.render(containerId, layout);
        _pianoNoteMap    = noteMap;
        _pianoTotalWidth = canvas.width;   // keyboard's full native pixel width
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
