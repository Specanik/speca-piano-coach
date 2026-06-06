/**
 * HomeView — Simply Piano-style home screen.
 * Vertical chapter path, continue card, stats, free play entry.
 */
const HomeView = (() => {

    /* Chapter definitions — group lessons into thematic sections */
    const CHAPTERS = [
        { id: 1, icon: '🎹', name: 'Nhập môn Piano', color: '#4a9eff', lessons: 4 },
        { id: 2, icon: '🎵', name: 'Giai điệu đầu tiên', color: '#9b59b6', lessons: 4 },
        { id: 3, icon: '🎼', name: 'Đọc nốt nhạc', color: '#e74c3c', lessons: 4 },
        { id: 4, icon: '🎶', name: 'Hợp âm & Nhịp điệu', color: '#f39c12', lessons: 4 },
        { id: 5, icon: '🌟', name: 'Bài hát hoàn chỉnh', color: '#00d4aa', lessons: 0 },
    ];

    function render() {
        const el = document.getElementById('home-content');
        if (!el) return;

        const stats    = ProgressStore.getStats();
        const lessons  = LessonsData.getAll();
        const progress = ProgressStore.getProgress();

        let currentIdx = lessons.findIndex(l => !ProgressStore.isCompleted(l.id));
        if (currentIdx === -1) currentIdx = lessons.length - 1;
        const currentLesson = lessons[currentIdx];

        const totalCompleted  = stats.totalCompleted;
        const overallProgress = Math.round((totalCompleted / Math.max(1, lessons.length)) * 100);

        const suggestion = (typeof AdaptiveEngine !== 'undefined')
            ? AdaptiveEngine.getSuggestion() : null;

        const daily = (typeof AdaptiveEngine !== 'undefined' && typeof SongsData !== 'undefined')
            ? AdaptiveEngine.getDailyChallenge() : null;

        const suggestionHTML = suggestion && suggestion.type !== 'start' ? `
            <div class="home-suggestion">
                <span style="flex-shrink:0;font-size:1.1rem">💡</span>
                <div>${suggestion.message}</div>
            </div>` : '';

        const dailyHTML = daily ? `
            <div class="home-daily-card" id="daily-challenge-card">
                <div class="home-daily-label">⭐ Thử thách hôm nay</div>
                <div class="home-daily-title">
                    ${daily.song?.thumbnail || '🎵'} ${daily.song?.title || 'Bài hát ngẫu nhiên'}
                </div>
                <div class="home-daily-tip">💡 ${daily.tip}</div>
            </div>` : '';

        el.innerHTML = `
            <div class="home-view">

                <!-- Hero section -->
                <div class="home-hero">
                    <div class="home-greeting">${_greeting()}</div>
                    ${suggestionHTML}

                    <!-- Continue card -->
                    <div class="home-cta-card" id="home-cta">
                        <div class="home-cta-badge">⚡ Tiếp tục học</div>
                        <div class="home-cta-title">
                            ${currentLesson.thumbnail} ${currentLesson.title}
                        </div>
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

                <!-- Stats row -->
                <div class="home-stats-row">
                    <div class="home-stat-card">
                        <span class="home-stat-value">🔥${stats.streakDays}</span>
                        <span class="home-stat-label">Chuỗi ngày</span>
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

                <!-- Section title -->
                <div class="home-section-header">
                    <div class="home-section-title">Lộ trình học tập</div>
                    <button class="home-section-link" id="home-view-all">Xem tất cả</button>
                </div>

                <!-- Vertical lesson path -->
                <div class="lesson-path" id="lesson-path">
                    ${_renderPath(lessons, currentIdx, progress)}
                </div>

                <!-- Free play card -->
                <div class="home-free-play-card" id="home-free-play-btn">
                    <div class="home-free-play-icon">🎹</div>
                    <div class="home-free-play-info">
                        <div class="home-free-play-title">Chơi tự do</div>
                        <div class="home-free-play-sub">Chơi piano không giới hạn — MIDI, hợp âm, thu âm</div>
                    </div>
                    <div class="home-free-play-arrow">›</div>
                </div>

            </div>`;

        _bindEvents(currentLesson, null, daily);
    }

    function _bindEvents(currentLesson, _lessons, daily) {
        document.getElementById('home-start-btn')?.addEventListener('click', () => {
            _startLesson(currentLesson.id);
        });

        document.getElementById('daily-challenge-card')?.addEventListener('click', () => {
            if (daily?.song) {
                Router.go('practice');
                requestAnimationFrame(() => document.querySelector('[data-ptab="songs"]')?.click());
            }
        });

        document.getElementById('home-view-all')?.addEventListener('click', () => {
            Router.go('learn');
        });

        document.getElementById('home-free-play-btn')?.addEventListener('click', () => {
            Router.go('freeplay');
            requestAnimationFrame(() => FreePlayView?.show?.());
        });

        document.querySelectorAll('.path-node-item:not(.locked)').forEach(node => {
            node.addEventListener('click', () => {
                const id = node.dataset.lessonId;
                if (id) _startLesson(id);
            });
        });
    }

    function _renderPath(lessons, currentIdx, progress) {
        const lessonsPerChapter = 4;
        let html = '';

        // Group lessons into chapters
        for (let ci = 0; ci < CHAPTERS.length; ci++) {
            const ch      = CHAPTERS[ci];
            const start   = ci * lessonsPerChapter;
            const end     = Math.min(start + lessonsPerChapter, lessons.length);
            const group   = lessons.slice(start, end);
            if (group.length === 0 && ci > 0) continue;

            const completedInChapter = group.filter(l => ProgressStore.isCompleted(l.id)).length;

            html += `
                <div class="path-chapter">
                    <div class="path-chapter-header" data-ch="${ch.id}" style="margin-top:${ci > 0 ? '16px' : '0'}">
                        <div class="path-chapter-icon">${ch.icon}</div>
                        <div class="path-chapter-info">
                            <div class="path-chapter-num">Chương ${ch.id}</div>
                            <div class="path-chapter-name">${ch.name}</div>
                        </div>
                        <div class="path-chapter-count">${completedInChapter}/${group.length}</div>
                    </div>
                    <div class="path-nodes">
                        ${group.map((lesson, j) => _renderNode(lesson, start + j, currentIdx, progress)).join('')}
                    </div>
                </div>`;
        }

        return html;
    }

    function _renderNode(lesson, idx, currentIdx, progress) {
        const result = progress.completedLessons[lesson.id];
        const stars  = result?.stars || 0;
        const state  = result         ? 'done'
                     : idx === currentIdx ? 'current'
                     : idx > currentIdx   ? 'locked'
                     : 'done';

        let overlay = '';
        if (state === 'done') {
            overlay = `<div class="path-done-check">✓</div>`;
        } else if (state === 'locked') {
            overlay = `<div class="path-lock-icon">🔒</div>`;
        }

        const starBadge = state === 'done' && stars > 0
            ? `<div class="path-star-count">${stars}★</div>` : '';

        const ctaTag = state === 'current'
            ? `<div class="path-node-cta">Nhấn để học ▶</div>` : '';

        return `
            <div class="path-node-item ${state}" data-lesson-id="${lesson.id}">
                <div class="path-node-circle">
                    ${lesson.thumbnail}
                    ${overlay}
                    ${starBadge}
                </div>
                <div class="path-node-label">${lesson.title}</div>
                ${ctaTag}
            </div>`;
    }

    function _greeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Chào buổi sáng! ☀️';
        if (h < 18) return 'Chào buổi chiều! 🌤️';
        return 'Chào buổi tối! 🌙';
    }

    function _startLesson(lessonId) {
        Router.go('learn');
        requestAnimationFrame(() => LearnView.startLesson(lessonId));
    }

    return { render };
})();
