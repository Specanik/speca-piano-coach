/**
 * DashboardUI — renders the progress dashboard modal.
 * Shows: XP, streak, completed lessons, badge collection.
 */
const DashboardUI = (() => {
    let _overlay = null;

    function init() {
        _overlay = document.createElement('div');
        _overlay.className = 'dashboard-overlay hidden';
        _overlay.innerHTML = `<div class="dashboard-panel" id="dashboard-panel"></div>`;
        _overlay.addEventListener('click', e => {
            if (e.target === _overlay) hide();
        });
        document.body.appendChild(_overlay);
    }

    function show() {
        if (!_overlay) init();
        _render();
        _overlay.classList.remove('hidden');
    }

    function hide() {
        _overlay?.classList.add('hidden');
    }

    function _render() {
        const panel = document.getElementById('dashboard-panel');
        if (!panel) return;

        const stats  = ProgressStore.getStats();
        const badges = ProgressStore.getAllBadges();
        const lessons = LessonsData.getAll();

        const completedLessons = ProgressStore.getProgress().completedLessons;

        panel.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-title">🏆 Tiến trình học tập</div>
                <button class="lesson-close-btn" id="dashboard-close">✕</button>
            </div>

            <div class="dashboard-stats-grid">
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">⚡${stats.xp}</span>
                    <div class="dashboard-stat-label">Điểm XP</div>
                </div>
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">🔥${stats.streakDays}</span>
                    <div class="dashboard-stat-label">Ngày liên tiếp</div>
                </div>
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">${stats.totalCompleted}<small style="font-size:0.9rem;color:#6888a8">/${lessons.length}</small></span>
                    <div class="dashboard-stat-label">Bài hoàn thành</div>
                </div>
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">${stats.avgScore || 0}<small style="font-size:0.8rem;color:#6888a8">đ</small></span>
                    <div class="dashboard-stat-label">Điểm TB</div>
                </div>
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">⭐${stats.starsEarned}</span>
                    <div class="dashboard-stat-label">Sao tích lũy</div>
                </div>
                <div class="dashboard-stat">
                    <span class="dashboard-stat-value">🎖️${stats.badgesCount}</span>
                    <div class="dashboard-stat-label">Huy hiệu</div>
                </div>
            </div>

            <div class="dashboard-badges-title">Huy hiệu</div>
            <div class="dashboard-badges-grid">
                ${badges.map(b => `
                    <div class="dashboard-badge-card ${b.earned ? 'earned' : ''}" title="${b.description}">
                        <span class="dashboard-badge-icon">${b.icon}</span>
                        <div class="dashboard-badge-name">${b.name}</div>
                    </div>`).join('')}
            </div>

            <div class="dashboard-badges-title">Lịch sử bài học</div>
            <div style="display:flex;flex-direction:column;gap:6px">
                ${lessons.map((l, i) => {
                    const r = completedLessons[l.id];
                    const stars = r?.stars || 0;
                    const score = r?.score;
                    return `
                        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                                    background:rgba(100,160,255,${r ? '0.08' : '0.03'});
                                    border:1px solid rgba(100,160,255,${r ? '0.18' : '0.08'});
                                    border-radius:8px">
                            <span style="font-size:1.2rem">${l.thumbnail}</span>
                            <div style="flex:1;min-width:0">
                                <div style="font-size:0.78rem;font-weight:700;color:${r ? '#e0eaff' : '#5a7898'};
                                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                    ${i + 1}. ${l.title}
                                </div>
                            </div>
                            <div style="text-align:right;flex-shrink:0">
                                ${r ? `
                                    <div style="font-size:0.82rem;color:#f0c040">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
                                    <div style="font-size:0.7rem;color:#7a9ab8">${score}đ</div>
                                ` : `<div style="font-size:0.7rem;color:#445566">Chưa học</div>`}
                            </div>
                        </div>`;
                }).join('')}
            </div>

            <div style="text-align:center;margin-top:16px">
                <button class="lesson-btn lesson-btn-secondary" id="dashboard-reset"
                    style="font-size:0.7rem;padding:6px 16px;max-width:160px">
                    🗑️ Xóa tiến trình
                </button>
            </div>`;

        document.getElementById('dashboard-close')
            ?.addEventListener('click', hide);

        document.getElementById('dashboard-reset')
            ?.addEventListener('click', () => {
                if (confirm('Xóa toàn bộ tiến trình học? Không thể hoàn tác.')) {
                    ProgressStore.reset();
                    _render();
                }
            });
    }

    return { init, show, hide };
})();
