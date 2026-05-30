/**
 * ProgressStore — lưu và đọc tiến trình học từ localStorage.
 *
 * Cấu trúc dữ liệu lưu trữ:
 * {
 *   completedLessons: { [lessonId]: { score, stars, completedAt, attempts } },
 *   xp:               number,
 *   streakDays:       number,
 *   lastActivDate:    string (ISO),
 *   badges:           string[],   // badge IDs đã mở khóa
 *   totalSessions:    number
 * }
 *
 * API:
 *   ProgressStore.completeLesson(lessonId, summary)  lưu kết quả bài học
 *   ProgressStore.getProgress()                      toàn bộ dữ liệu
 *   ProgressStore.getLessonResult(lessonId)          kết quả bài cụ thể
 *   ProgressStore.isCompleted(lessonId)              bool
 *   ProgressStore.getXP()                            tổng XP
 *   ProgressStore.getStreakDays()                    chuỗi ngày liên tiếp
 *   ProgressStore.reset()                            xóa toàn bộ (debug)
 *   ProgressStore.getStats()                         thống kê tổng quan
 */
const ProgressStore = (() => {
    const KEY = 'piano-progress-v1';

    // ── Helpers ────────────────────────────────────────────────────────────
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : _defaultData();
        } catch {
            return _defaultData();
        }
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[ProgressStore] Could not save:', e);
        }
    }

    function _defaultData() {
        return {
            completedLessons: {},
            xp:               0,
            streakDays:       0,
            lastActiveDate:   null,
            badges:           [],
            totalSessions:    0
        };
    }

    // ── Streak calculation ─────────────────────────────────────────────────
    function _updateStreak(data) {
        const today = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
        const last  = data.lastActiveDate;

        if (!last) {
            data.streakDays    = 1;
            data.lastActiveDate = today;
            return;
        }
        if (last === today) return;  // same day, no change

        const lastDate  = new Date(last);
        const todayDate = new Date(today);
        const diffDays  = Math.round((todayDate - lastDate) / 86400000);

        if (diffDays === 1) {
            data.streakDays++;
        } else {
            data.streakDays = 1;  // streak broken
        }
        data.lastActiveDate = today;
    }

    // ── Badge rules ────────────────────────────────────────────────────────
    const BADGE_RULES = [
        {
            id: 'first-note',
            name: 'Nốt đầu tiên',
            icon: '🎵',
            description: 'Hoàn thành bài học đầu tiên',
            check: data => Object.keys(data.completedLessons).length >= 1
        },
        {
            id: 'week-streak',
            name: 'Một tuần kiên trì',
            icon: '🔥',
            description: 'Học 7 ngày liên tiếp',
            check: data => data.streakDays >= 7
        },
        {
            id: 'c-major-master',
            name: 'Bậc thầy C Major',
            icon: '🎼',
            description: 'Hoàn thành bài học hợp âm C với 3 sao',
            check: data => data.completedLessons['lesson-03']?.stars === 3
        },
        {
            id: 'golden-chord',
            name: 'Vòng Vàng',
            icon: '⭐',
            description: 'Hoàn thành bài học vòng C-Am-F-G',
            check: data => !!data.completedLessons['lesson-06']
        },
        {
            id: 'xp-100',
            name: 'Nhập môn Piano',
            icon: '🌱',
            description: 'Tích lũy 100 XP',
            check: data => data.xp >= 100
        },
        {
            id: 'xp-500',
            name: 'Học trò chăm chỉ',
            icon: '📚',
            description: 'Tích lũy 500 XP',
            check: data => data.xp >= 500
        },
        {
            id: 'all-beginner',
            name: 'Vượt qua Nhập môn',
            icon: '🏆',
            description: 'Hoàn thành tất cả 10 bài học cơ bản',
            check: data => Object.keys(data.completedLessons).length >= 10
        },
        {
            id: 'perfectionist',
            name: 'Hoàn Hảo',
            icon: '💎',
            description: 'Đạt 3 sao trong 5 bài liên tiếp',
            check: data => {
                const ids = Object.keys(data.completedLessons).sort();
                let streak = 0;
                for (const id of ids) {
                    if (data.completedLessons[id].stars === 3) {
                        streak++;
                        if (streak >= 5) return true;
                    } else {
                        streak = 0;
                    }
                }
                return false;
            }
        }
    ];

    function _checkBadges(data) {
        const newBadges = [];
        BADGE_RULES.forEach(rule => {
            if (!data.badges.includes(rule.id) && rule.check(data)) {
                data.badges.push(rule.id);
                newBadges.push(rule);
            }
        });
        return newBadges;
    }

    // ── Public API ─────────────────────────────────────────────────────────
    function completeLesson(lessonId, summary) {
        const data = load();
        const prev = data.completedLessons[lessonId];

        // Only update if better score (or first completion)
        if (!prev || summary.totalScore > prev.score) {
            const lesson = (typeof LessonsData !== 'undefined')
                ? LessonsData.getById(lessonId)
                : null;
            const xpGain = lesson
                ? Math.round(lesson.xp * (summary.totalScore / 100))
                : 0;

            // Remove old XP if re-completing
            if (prev) data.xp -= prev.xpGain || 0;
            data.xp += xpGain;

            data.completedLessons[lessonId] = {
                score:       summary.totalScore,
                stars:       summary.stars,
                accuracy:    summary.accuracy,
                completedAt: new Date().toISOString(),
                xpGain
            };
        }

        data.totalSessions++;
        _updateStreak(data);
        const newBadges = _checkBadges(data);
        save(data);

        return { data, newBadges };
    }

    function getProgress() { return load(); }

    function getLessonResult(lessonId) {
        return load().completedLessons[lessonId] || null;
    }

    function isCompleted(lessonId) {
        return !!load().completedLessons[lessonId];
    }

    function getXP() { return load().xp; }

    function getStreakDays() { return load().streakDays; }

    function getStats() {
        const data  = load();
        const completed = Object.values(data.completedLessons);
        return {
            totalCompleted:  completed.length,
            xp:              data.xp,
            streakDays:      data.streakDays,
            totalSessions:   data.totalSessions,
            avgScore:        completed.length
                ? Math.round(completed.reduce((s, l) => s + l.score, 0) / completed.length)
                : 0,
            starsEarned:     completed.reduce((s, l) => s + (l.stars || 0), 0),
            badgesCount:     data.badges.length,
            badges:          data.badges
        };
    }

    function getAllBadges() {
        const earned = new Set(load().badges);
        return BADGE_RULES.map(b => ({ ...b, earned: earned.has(b.id) }));
    }

    function reset() {
        localStorage.removeItem(KEY);
    }

    return {
        completeLesson,
        getProgress,
        getLessonResult,
        isCompleted,
        getXP,
        getStreakDays,
        getStats,
        getAllBadges,
        reset
    };
})();
