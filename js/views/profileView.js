/**
 * ProfileView — renders the Profile/Progress screen.
 * Shows: avatar, XP bar, streak calendar, badges, lesson history.
 */
const ProfileView = (() => {

    function render() {
        const el = document.getElementById('profile-content');
        if (!el) return;

        const stats    = ProgressStore.getStats();
        const badges   = ProgressStore.getAllBadges();
        const lessons  = LessonsData.getAll();
        const progress = ProgressStore.getProgress();

        // Level calculation
        const level     = Math.floor(stats.xp / 200) + 1;
        const levelXP   = stats.xp % 200;
        const xpToNext  = 200;

        // Streak calendar (last 21 days)
        const today   = new Date();
        const calDays = Array.from({ length: 21 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (20 - i));
            return {
                date:    d.toISOString().slice(0, 10),
                isToday: i === 20
            };
        });

        const activeDates = new Set(
            Object.values(progress.completedLessons)
                .map(r => r.completedAt?.slice(0, 10))
                .filter(Boolean)
        );

        el.innerHTML = `
            <div class="profile-avatar-section">
                <div class="profile-avatar">🎹</div>
                <div class="profile-name">Học viên Piano</div>
                <div class="profile-level">Cấp độ ${level} · ${_levelName(level)}</div>
            </div>

            <div style="padding:0 16px 16px">

                <!-- XP progress -->
                <div class="profile-xp-section">
                    <div class="profile-xp-label">
                        <span>⚡ ${stats.xp} XP</span>
                        <span>Cần thêm ${xpToNext - levelXP} XP để lên Cấp ${level + 1}</span>
                    </div>
                    <div class="profile-xp-bar">
                        <div class="profile-xp-fill" style="width:${Math.round(levelXP / xpToNext * 100)}%"></div>
                    </div>
                </div>

                <!-- Stats grid -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px">
                    ${[
                        { v: `🔥${stats.streakDays}`, l: 'Streak' },
                        { v: `✅${stats.totalCompleted}`, l: 'Bài hoàn thành' },
                        { v: `⭐${stats.starsEarned}`, l: 'Sao đạt được' },
                        { v: `📊${stats.avgScore || 0}`, l: 'Điểm TB' },
                        { v: `🎖️${stats.badgesCount}`, l: 'Huy hiệu' },
                        { v: `📅${stats.totalSessions}`, l: 'Buổi học' },
                    ].map(s => `
                        <div class="home-stat-card">
                            <span class="home-stat-value">${s.v}</span>
                            <span class="home-stat-label">${s.l}</span>
                        </div>`).join('')}
                </div>

                <!-- Streak calendar -->
                <div class="profile-section-title">🔥 Chuỗi học tập (21 ngày qua)</div>
                <div class="streak-calendar" style="margin-bottom:18px">
                    ${calDays.map(d => `
                        <div class="streak-day ${activeDates.has(d.date) ? 'active' : ''} ${d.isToday ? 'today' : ''}"
                             title="${d.date}"></div>`).join('')}
                </div>

                <!-- Badges -->
                <div class="profile-section-title">🏅 Huy hiệu</div>
                <div class="profile-badges-grid" style="margin-bottom:18px">
                    ${badges.map(b => `
                        <div class="profile-badge ${b.earned ? 'earned' : ''}" title="${b.description}">
                            <span class="profile-badge-icon">${b.icon}</span>
                            <div class="profile-badge-name">${b.name}</div>
                        </div>`).join('')}
                </div>

                <!-- Lesson history -->
                <div class="profile-section-title">📚 Lịch sử bài học</div>
                <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:80px">
                    ${lessons.map((l, i) => {
                        const r = progress.completedLessons[l.id];
                        const stars = r?.stars || 0;
                        return `
                            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
                                        background:rgba(100,160,255,${r ? '0.08' : '0.03'});
                                        border:1px solid rgba(100,160,255,${r ? '0.18' : '0.07'});
                                        border-radius:10px;">
                                <span style="font-size:1.2rem">${l.thumbnail}</span>
                                <div style="flex:1;min-width:0">
                                    <div style="font-size:0.78rem;font-weight:700;
                                                color:${r ? '#d0e8ff' : '#3a5878'};
                                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                        ${i + 1}. ${l.title}
                                    </div>
                                </div>
                                <div style="text-align:right;flex-shrink:0">
                                    ${r ? `
                                        <div style="font-size:0.8rem;color:#f0c040">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
                                        <div style="font-size:0.68rem;color:#5a7898">${r.score}đ</div>
                                    ` : `<div style="font-size:0.68rem;color:#2a3a4a">Chưa học</div>`}
                                </div>
                            </div>`;
                    }).join('')}
                </div>

                <!-- Reset -->
                <div style="text-align:center;padding-bottom:20px">
                    <button id="profile-reset-btn" style="background:none;border:1px solid rgba(255,80,80,0.2);
                        border-radius:8px;color:#ff6060;font-size:0.72rem;padding:8px 18px;cursor:pointer;font-family:inherit">
                        🗑️ Xóa tiến trình học
                    </button>
                </div>
            </div>`;

        document.getElementById('profile-reset-btn')?.addEventListener('click', () => {
            if (confirm('Xóa toàn bộ tiến trình? Không thể hoàn tác.')) {
                ProgressStore.reset();
                render();
                AppShell?.updateStats?.();
            }
        });
    }

    function _levelName(level) {
        const names = ['', 'Nhập môn', 'Sơ cấp', 'Trung cấp', 'Nâng cao', 'Chuyên nghiệp', 'Bậc thầy'];
        return names[Math.min(level, names.length - 1)] || 'Bậc thầy';
    }

    return { render };
})();
