/**
 * ComboSystem — micro-celebration system.
 * Fires visual & audio rewards for consecutive correct notes.
 *
 * Simply Piano / Yousician finding: dopamine micro-rewards every
 * 3-5 correct notes dramatically improve session duration.
 *
 * API:
 *   ComboSystem.noteCorrect()   → fires reward if combo milestone
 *   ComboSystem.noteWrong()     → breaks combo
 *   ComboSystem.reset()
 *   ComboSystem.getCombo()      → current combo count
 */
const ComboSystem = (() => {
    let _combo   = 0;
    let _overlay = null;

    const MILESTONES = [3, 5, 10, 15, 20, 30, 50];
    const MESSAGES   = {
        3:  ['👍 Tốt lắm!',       '#4a9eff'],
        5:  ['🔥 Combo x5!',      '#ffa032'],
        10: ['⚡ Tuyệt vời!',      '#f0c040'],
        15: ['🌟 Đỉnh cao!',       '#50c878'],
        20: ['💎 Bậc thầy!',       '#c864ff'],
        30: ['🚀 Không thể tin!',  '#ff6040'],
        50: ['🏆 LEGENDARY!',     '#ffd700'],
    };

    function _ensureOverlay() {
        if (_overlay) return;
        _overlay = document.createElement('div');
        _overlay.style.cssText = `
            position: fixed;
            top: 15%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 600;
            pointer-events: none;
            text-align: center;
        `;
        document.body.appendChild(_overlay);
    }

    function _showReward(combo) {
        const config = MESSAGES[combo] || MESSAGES[Math.max(...MILESTONES.filter(m => combo >= m))];
        if (!config) return;

        const [text, color] = config;
        _ensureOverlay();

        const pop = document.createElement('div');
        pop.style.cssText = `
            display: inline-block;
            padding: 10px 24px;
            background: ${color}22;
            border: 2px solid ${color};
            border-radius: 30px;
            color: ${color};
            font-size: 1.1rem;
            font-weight: 800;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 0 20px ${color}66;
            animation: comboPop 0.8s ease forwards;
        `;
        pop.textContent = `${text}`;

        // Add combo count badge
        const badge = document.createElement('div');
        badge.style.cssText = `
            display: block;
            font-size: 0.75rem;
            color: ${color}99;
            margin-top: 2px;
            font-weight: 600;
        `;
        badge.textContent = `${combo} nốt liên tiếp`;
        pop.appendChild(badge);

        _overlay.appendChild(pop);

        // Auto remove
        setTimeout(() => pop.remove(), 1200);
    }

    // Add keyframe animation if not present
    if (!document.getElementById('combo-keyframes')) {
        const style = document.createElement('style');
        style.id = 'combo-keyframes';
        style.textContent = `
            @keyframes comboPop {
                0%   { opacity: 0; transform: scale(0.5) translateY(10px); }
                30%  { opacity: 1; transform: scale(1.15) translateY(-5px); }
                70%  { opacity: 1; transform: scale(1) translateY(0); }
                100% { opacity: 0; transform: scale(0.9) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    function noteCorrect() {
        _combo++;
        if (MILESTONES.includes(_combo)) {
            _showReward(_combo);
        }
        return _combo;
    }

    function noteWrong() {
        const prev = _combo;
        _combo = 0;
        return prev;
    }

    function reset() { _combo = 0; }

    function getCombo() { return _combo; }

    return { noteCorrect, noteWrong, reset, getCombo };
})();
