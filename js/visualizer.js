const Visualizer = (() => {
    const SPEED   = 0.10; // px per ms
    const FADE_PX = 60;   // fade-out region near top of canvas

    const THEME_COLORS = {
        classic: { white: '#4a9eff', black: '#9955ff', glow: false },
        grand:   { white: '#e8a020', black: '#c07010', glow: false },
        neon:    { white: '#00e5ff', black: '#dd00ff', glow: true  },
        minimal: { white: '#4a80c0', black: '#3060a0', glow: false },
    };

    let canvas = null;
    let ctx    = null;
    let noteMap = {};
    let activeNotes  = new Map(); // midi -> pressTime (ms)
    let releasedNotes = [];       // { midi, pressTime, releaseTime }
    let animId = null;

    function getColors() {
        const theme = document.body.dataset.theme || 'classic';
        return THEME_COLORS[theme] || THEME_COLORS.classic;
    }

    function fillRoundRect(x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.fill();
    }

    function drawBar(info, topY, barH, alpha, colors) {
        const clippedTop = Math.max(topY, 0);
        const clippedBot = Math.min(topY + barH, canvas.height);
        if (clippedTop >= clippedBot || alpha <= 0) return;

        const color = info.isBlack ? colors.black : colors.white;
        const x = info.xCenter - info.width / 2;
        const w = info.width;

        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha);

        if (colors.glow) {
            ctx.shadowBlur = 14;
            ctx.shadowColor = color;
        }

        ctx.fillStyle = color;
        fillRoundRect(x + 2, clippedTop, w - 4, clippedBot - clippedTop, Math.min(4, (w - 4) / 2));
        ctx.restore();
    }

    function loop() {
        const now = performance.now();
        const H   = canvas.height;
        const colors = getColors();

        ctx.clearRect(0, 0, canvas.width, H);

        // Separator line at keyboard level
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(0, H - 1, canvas.width, 1);

        // Prune bars that have scrolled fully off the top
        releasedNotes = releasedNotes.filter(n => {
            const barH      = (n.releaseTime - n.pressTime) * SPEED;
            const barBottom = H - (now - n.releaseTime) * SPEED;
            return barBottom + barH > 0;
        });

        // Draw released notes (scrolling upward)
        releasedNotes.forEach(n => {
            const info = noteMap[n.midi];
            if (!info) return;
            const barH      = Math.max(4, (n.releaseTime - n.pressTime) * SPEED);
            const barBottom = H - (now - n.releaseTime) * SPEED;
            const barTop    = barBottom - barH;
            const alpha     = Math.min(1, barBottom / FADE_PX);
            drawBar(info, barTop, barH, alpha, colors);
        });

        // Draw active notes (anchored at bottom, growing upward)
        activeNotes.forEach((pressTime, midi) => {
            const info = noteMap[midi];
            if (!info) return;
            const barH   = Math.max(4, (now - pressTime) * SPEED);
            const barTop = H - barH;
            drawBar(info, barTop, barH, 1.0, colors);
        });

        animId = requestAnimationFrame(loop);
    }

    function init(canvasEl, map) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
        canvas = canvasEl;
        ctx    = canvas.getContext('2d');
        noteMap = map;
        activeNotes.clear();
        releasedNotes = [];
        loop();
    }

    function noteOn(midi) {
        if (!canvas) return;
        activeNotes.set(midi, performance.now());
    }

    function noteOff(midi) {
        if (!canvas || !activeNotes.has(midi)) return;
        releasedNotes.push({
            midi,
            pressTime:   activeNotes.get(midi),
            releaseTime: performance.now(),
        });
        activeNotes.delete(midi);
    }

    function destroy() {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
    }

    return { init, noteOn, noteOff, destroy };
})();
