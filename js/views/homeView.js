/**
 * HomeView — renders the Home screen.
 * Shows: CTA card, stats, and Duolingo-style lesson path.
 */
const HomeView = (() => {

    function render() {
        const el = document.getElementById('home-content');
        if (!el) return;

        const stats    = ProgressStore.getStats();
        const lessons  = LessonsData.getAll();
        const progress = ProgressStore.getProgress();

        // Find current lesson (first incomplete)
        let currentIdx = lessons.findIndex(l => !ProgressStore.isCompleted(l.id));
        if (currentIdx === -1) currentIdx = lessons.length - 1;
        const currentLesson = lessons[currentIdx];

        const totalCompleted  = stats.totalCompleted;
        const overallProgress = Math.round((totalCompleted / lessons.length) * 100);

        // Adaptive suggestion
        const suggestion = (typeof AdaptiveEngine !== 'undefined')
            ? AdaptiveEngine.getSuggestion() : null;

        // Daily challenge
        const daily = (typeof AdaptiveEngine !== 'undefined' && typeof SongsData !== 'undefined')
            ? AdaptiveEngine.getDailyChallenge() : null;

        const suggestionHTML = suggestion && suggestion.type !== 'start' ? `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;
                background:rgba(74,158,255,0.07);border:1px solid rgba(74,158,255,0.15);
                border-radius:10px;margin:0 0 10px;font-size:0.78rem;color:#8ab8d8;line-height:1.5">
                <span style="flex-shrink:0;font-size:1.1rem">💡</span>
                <div>${suggestion.message}</div>
            </div>` : '';

        const dailyHTML = daily ? `
            <div style="background:rgba(240,192,64,0.08);border:1px solid rgba(240,192,64,0.2);
                border-radius:12px;padding:12px 14px;margin:0 0 10px;cursor:pointer"
                id="daily-challenge-card">
                <div style="font-size:0.65rem;font-weight:700;color:#f0c040;text-transform:uppercase;
                    letter-spacing:0.08em;margin-bottom:5px">⭐ Thử thách hôm nay</div>
                <div style="font-size:0.88rem;font-weight:700;color:#e0eaff">
                    ${daily.song?.thumbnail || '🎵'} ${daily.song?.title || 'Bài hát ngẫu nhiên'}
                </div>
                <div style="font-size:0.72rem;color:#8a9aaa;margin-top:3px">💡 ${daily.tip}</div>
            </div>` : '';

        el.innerHTML = `
            <div class="home-view">
                <div class="home-hero">
                    <div class="home-greeting">${_greeting()}</div>

                    ${suggestionHTML}

                    <div class="home-cta-card" id="home-cta">
                        <div class="home-cta-badge">⚡ Tiếp tục học</div>
                        <div class="home-cta-title">${currentLesson.thumbnail} ${currentLesson.title}</div>
                        <div class="home-cta-sub">${currentLesson.description}</div>
                        <div class="home-cta-progress">
                            <div class="home-progress-bar">
                                <div class="home-progress-fill" style="width:${overallProgress}%"></div>
                            </div>
                            <div class="home-progress-text">${totalCompleted}/${lessons.length} bài</div>
                        </div>
                        <button class="home-cta-btn" id="home-start-btn">
                            🎹 Bắt đầu học
                        </button>
                    </div>

                    ${dailyHTML}
                </div>

                <div class="home-stats-row">
                    <div class="home-stat-card">
                        <span class="home-stat-value">🔥${stats.streakDays}</span>
                        <span class="home-stat-label">Ngày liên tiếp</span>
                    </div>
                    <div class="home-stat-card">
                        <span class="home-stat-value">⚡${stats.xp}</span>
                        <span class="home-stat-label">XP tích lũy</span>
                    </div>
                    <div class="home-stat-card">
                        <span class="home-stat-value">⭐${stats.starsEarned}</span>
                        <span class="home-stat-label">Sao đạt được</span>
                    </div>
                </div>

                <div class="home-section-header">
                    <div class="home-section-title">Lộ trình học tập</div>
                    <button class="home-section-link" id="home-view-all">Xem tất cả</button>
                </div>

                <div class="lesson-path" id="lesson-path">
                    ${_renderPath(lessons, currentIdx, progress)}
                </div>
            </div>`;

        // Events
        document.getElementById('home-start-btn')?.addEventListener('click', () => {
            _startLesson(currentLesson.id);
        });

        document.getElementById('daily-challenge-card')?.addEventListener('click', () => {
            if (daily?.song) {
                Router.go('practice');
                setTimeout(() => {
                    // Switch to songs tab and start playing
                    const songsBtn = document.querySelector('[data-ptab="songs"]');
                    songsBtn?.click();
                }, 100);
            }
        });

        document.getElementById('home-view-all')?.addEventListener('click', () => {
            Router.go('learn');
        });

        // Path node clicks
        document.querySelectorAll('.path-node:not(.locked)').forEach(node => {
            node.addEventListener('click', () => {
                const id = node.dataset.lessonId;
                if (id) _startLesson(id);
            });
        });
    }

    function _renderPath(lessons, currentIdx, progress) {
        // Layout: zigzag pattern — groups of 3 in alternating alignment
        const rows = [];
        let i = 0;

        while (i < lessons.length) {
            const group = lessons.slice(i, i + 3);
            const direction = Math.floor(i / 3) % 2 === 0 ? 'right' : 'left';
            rows.push({ group, startIdx: i, direction });
            i += 3;
        }

        return rows.map(({ group, startIdx, direction }) => {
            const nodesHTML = group.map((lesson, j) => {
                const idx    = startIdx + j;
                const result = progress.completedLessons[lesson.id];
                const stars  = result?.stars || 0;
                const state  = result ? 'done'
                    : idx === currentIdx ? 'current'
                    : idx > currentIdx ? 'locked' : 'done';

                const starsHTML = state === 'done'
                    ? `<div class="path-star-count">${stars}★</div>` : '';

                const connector = j < group.length - 1
                    ? `<div class="path-connector ${state === 'done' ? 'done-line' : ''}"></div>`
                    : '';

                return `
                    <div class="path-node ${state}" data-lesson-id="${lesson.id}" title="${lesson.title}">
                        <div class="path-node-circle">
                            ${lesson.thumbnail}
                            ${starsHTML}
                        </div>
                        <div class="path-node-label">${lesson.title.split(' ').slice(0, 2).join(' ')}</div>
                    </div>
                    ${connector}`;
            }).join('');

            const offsetClass = direction === 'right' ? 'offset-right' : 'offset-left';
            return `<div class="path-row ${offsetClass}">${nodesHTML}</div>`;
        }).join('');
    }

    function _greeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng! ☀️';
        if (h < 18) return 'Chào buổi chiều! 🌤️';
        return 'Chào buổi tối! 🌙';
    }

    function _startLesson(lessonId) {
        Router.go('learn');
        // Small delay to let view transition complete
        setTimeout(() => LearnView.startLesson(lessonId), 50);
    }

    return { render };
})();
