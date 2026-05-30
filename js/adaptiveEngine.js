/**
 * AdaptiveEngine — AI-like adaptive learning.
 * No ML required — uses rule-based analysis of play history.
 *
 * Tracks weakness patterns and generates targeted micro-exercises:
 *   • Timing weakness → slower BPM, wider timing window
 *   • Note accuracy weakness → fewer notes, more hints
 *   • Specific note weakness → extra practice on that note
 *
 * API:
 *   AdaptiveEngine.recordAttempt(lessonId, stepType, result)
 *   AdaptiveEngine.getSuggestion()     → { type, message, lessonId? }
 *   AdaptiveEngine.getDifficulty()     → 'easy'|'medium'|'hard'
 *   AdaptiveEngine.getWeakNotes()      → midi[] (notes to practice more)
 *   AdaptiveEngine.getDailyChallenge() → { song, tip }
 */
const AdaptiveEngine = (() => {
    const KEY = 'piano-adaptive-v1';

    function _load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : _defaults();
        } catch { return _defaults(); }
    }

    function _save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
    }

    function _defaults() {
        return {
            attempts:     [],    // [{lessonId, stepType, score, noteAcc, timingScore, ts}]
            weakNotes:    {},    // midi → failure count
            sessionCount: 0,
            lastSession:  null
        };
    }

    // ── Record attempt ─────────────────────────────────────────────
    function recordAttempt(lessonId, stepType, result) {
        const data = _load();
        data.attempts.push({
            lessonId, stepType,
            score:       result.score       || 0,
            noteAcc:     result.noteAccuracy || 0,
            timingScore: result.timingScore  || 0,
            missingNotes:(result.missingNotes || []),
            ts:          Date.now()
        });

        // Track weak notes
        (result.missingNotes || []).forEach(midi => {
            data.weakNotes[midi] = (data.weakNotes[midi] || 0) + 1;
        });

        // Keep only last 100 attempts
        if (data.attempts.length > 100) data.attempts = data.attempts.slice(-100);

        _save(data);
    }

    // ── Analyse recent performance ──────────────────────────────────
    function _recentStats(n = 20) {
        const data     = _load();
        const recent   = data.attempts.slice(-n);
        if (!recent.length) return null;

        const avgScore   = recent.reduce((s, a) => s + a.score, 0) / recent.length;
        const avgTiming  = recent.reduce((s, a) => s + a.timingScore, 0) / recent.length;
        const avgNote    = recent.reduce((s, a) => s + a.noteAcc, 0) / recent.length;

        return { avgScore, avgTiming, avgNote, count: recent.length };
    }

    // ── Difficulty recommendation ───────────────────────────────────
    function getDifficulty() {
        const stats = _recentStats();
        if (!stats) return 'easy';
        if (stats.avgScore >= 85) return 'hard';
        if (stats.avgScore >= 60) return 'medium';
        return 'easy';
    }

    // ── Weak notes ──────────────────────────────────────────────────
    function getWeakNotes() {
        const data = _load();
        return Object.entries(data.weakNotes)
            .filter(([, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([midi]) => parseInt(midi));
    }

    // ── Personalized suggestion ─────────────────────────────────────
    function getSuggestion() {
        const stats = _recentStats(10);
        const diff  = getDifficulty();

        if (!stats) {
            return { type: 'start', message: '👋 Hãy bắt đầu bài học đầu tiên!', lessonId: 'lesson-01' };
        }

        if (stats.avgTiming < 50) {
            return {
                type: 'timing',
                message: `⏱️ Timing của bạn cần cải thiện — thử bật Metronome và chơi chậm hơn`,
                tip: 'Bắt đầu ở 60% tốc độ cho đến khi chính xác, rồi tăng dần'
            };
        }

        if (stats.avgNote < 60) {
            const weakNotes = getWeakNotes();
            const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
            const noteNames  = weakNotes.map(m => NOTE_NAMES[m % 12]).join(', ');
            return {
                type: 'notes',
                message: `🎹 Các nốt ${noteNames || 'một số nốt'} cần luyện thêm`,
                weakNotes
            };
        }

        if (diff === 'hard') {
            return {
                type: 'advance',
                message: `🚀 Bạn đang làm rất tốt! Hãy thử bài học khó hơn`,
            };
        }

        return {
            type: 'streak',
            message: `🔥 Tiếp tục luyện tập đều đặn để duy trì streak`,
        };
    }

    // ── Daily challenge ─────────────────────────────────────────────
    function getDailyChallenge() {
        const today = new Date().toISOString().slice(0, 10);
        const seed  = today.split('-').reduce((s, n) => s + parseInt(n), 0);

        // Pick a song based on difficulty and date
        const diff  = getDifficulty();
        const allSongs = typeof SongsData !== 'undefined' ? SongsData.getByDifficulty(diff) : [];
        if (!allSongs.length) return null;

        const song = allSongs[seed % allSongs.length];
        const tips = [
            'Thử chơi chậm hơn 30% và tăng dần',
            'Luyện tay phải trước, rồi mới ghép tay trái',
            'Đếm phách: 1-2-3-4 trong đầu khi chơi',
            'Nhắm mắt và nghe từng nốt — cảm nhận giai điệu',
            'Chơi 3 lần liên tiếp không sai mới chuyển tiếp'
        ];

        return {
            song,
            tip: tips[seed % tips.length],
            date: today
        };
    }

    // ── Session tracking ────────────────────────────────────────────
    function startSession() {
        const data = _load();
        data.sessionCount++;
        data.lastSession = new Date().toISOString();
        _save(data);
    }

    return { recordAttempt, getSuggestion, getDifficulty, getWeakNotes, getDailyChallenge, startSession };
})();
