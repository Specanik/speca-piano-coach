/**
 * Scorer — pure scoring logic for lesson exercises.
 *
 * Scores a single "attempt" (one note or one chord press) on three axes:
 *   1. noteAccuracy  : fraction of target notes pressed correctly (0–1)
 *   2. extraPenalty  : penalty for extra (wrong) notes pressed
 *   3. timingScore   : how close the press was to the ideal beat (0–1)
 *
 * Final score = noteAccuracy * 0.7 + timingScore * 0.3  (0–100)
 *
 * API:
 *   Scorer.scoreAttempt(params) → { score, noteAccuracy, timingScore, stars }
 *   Scorer.scoreSummary(attempts) → { totalScore, stars, accuracy, details }
 *   Scorer.starsFromScore(score) → 1 | 2 | 3
 */
const Scorer = (() => {

    const WEIGHTS = { note: 0.70, timing: 0.30 };

    /**
     * Score one attempt at playing a set of target notes.
     *
     * @param {object} p
     * @param {number[]} p.targetMidi   - notes the student should play
     * @param {number[]} p.playedMidi   - notes the student actually played
     * @param {number}   p.idealTimeMs  - when the note was supposed to sound
     * @param {number}   p.actualTimeMs - when the student actually pressed
     * @param {number}   [p.windowMs]   - full timing window (default 800 ms)
     * @returns {{ score, noteAccuracy, timingScore, extraNotes, missingNotes, stars }}
     */
    function scoreAttempt({ targetMidi, playedMidi, idealTimeMs, actualTimeMs, windowMs = 800 }) {
        const targetSet = new Set(targetMidi);
        const playedSet = new Set(playedMidi);

        // Note accuracy: correct / total_expected
        let correctCount = 0;
        targetSet.forEach(n => { if (playedSet.has(n)) correctCount++; });
        const noteAccuracy = targetSet.size > 0 ? correctCount / targetSet.size : 1;

        // Extra note penalty: each wrong note costs 0.15 (capped at 0.45)
        const extraNotes = [...playedSet].filter(n => !targetSet.has(n));
        const extraPenalty = Math.min(0.45, extraNotes.length * 0.15);

        const adjustedNoteAcc = Math.max(0, noteAccuracy - extraPenalty);

        // Timing score: linear decay from windowMs/2 → 0
        let timingScore = 0;
        if (idealTimeMs !== undefined && actualTimeMs !== undefined) {
            const delta = Math.abs(actualTimeMs - idealTimeMs);
            timingScore = Math.max(0, 1 - delta / (windowMs / 2));
        } else {
            timingScore = 1;  // no timing constraint → full marks
        }

        const missingNotes = [...targetSet].filter(n => !playedSet.has(n));

        const rawScore = adjustedNoteAcc * WEIGHTS.note + timingScore * WEIGHTS.timing;
        const score    = Math.round(rawScore * 100);

        return {
            score,
            noteAccuracy:  Math.round(adjustedNoteAcc * 100),
            timingScore:   Math.round(timingScore * 100),
            extraNotes,
            missingNotes,
            stars: starsFromScore(score)
        };
    }

    /**
     * Aggregate multiple attempt results into a lesson summary.
     *
     * @param {Array<{score, noteAccuracy, timingScore}>} attempts
     * @returns {{ totalScore, stars, accuracy, timingAvg, details }}
     */
    function scoreSummary(attempts) {
        if (!attempts || attempts.length === 0) {
            return { totalScore: 0, stars: 0, accuracy: 0, timingAvg: 0, details: [] };
        }

        const totalScore = Math.round(
            attempts.reduce((s, a) => s + a.score, 0) / attempts.length
        );
        const accuracy  = Math.round(
            attempts.reduce((s, a) => s + a.noteAccuracy, 0) / attempts.length
        );
        const timingAvg = Math.round(
            attempts.reduce((s, a) => s + a.timingScore, 0) / attempts.length
        );

        return {
            totalScore,
            stars: starsFromScore(totalScore),
            accuracy,
            timingAvg,
            details: attempts
        };
    }

    /**
     * Convert a 0-100 score to 1-3 stars.
     *   ≥ 90 → 3 stars
     *   ≥ 65 → 2 stars
     *   else → 1 star
     */
    function starsFromScore(score) {
        if (score >= 90) return 3;
        if (score >= 65) return 2;
        return 1;
    }

    /**
     * Grade label for display.
     */
    function gradeLabel(score) {
        if (score >= 95) return 'Xuất sắc!';
        if (score >= 85) return 'Rất tốt!';
        if (score >= 70) return 'Tốt';
        if (score >= 55) return 'Khá';
        return 'Cần luyện thêm';
    }

    return { scoreAttempt, scoreSummary, starsFromScore, gradeLabel };
})();
