const AudioEngine = (() => {
    let ctx = null;
    let masterGain = null;
    const activeNotes = new Map();

    function init() {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.55;
        masterGain.connect(ctx.destination);
    }

    function midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function startNote(noteId, midi) {
        if (!ctx) init();
        if (ctx.state === 'suspended') ctx.resume();
        if (activeNotes.has(noteId)) return;

        const freq = midiToFreq(midi);
        const now = ctx.currentTime;

        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(1.0, now + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.4, now + 0.2);
        envelope.connect(masterGain);

        const oscillators = [];

        const addOsc = (type, freqMult, gainVal) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq * freqMult;
            g.gain.value = gainVal;
            osc.connect(g);
            g.connect(envelope);
            osc.start(now);
            oscillators.push(osc);
        };

        addOsc('triangle', 1,   1.00);
        addOsc('sine',     2,   0.35);
        addOsc('sine',     3,   0.15);
        addOsc('sine',     4,   0.06);

        // Brief low-frequency thump to mimic hammer strike
        const thump = ctx.createOscillator();
        const thumpGain = ctx.createGain();
        thump.type = 'sine';
        thump.frequency.value = 80;
        thumpGain.gain.setValueAtTime(0.25, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        thump.connect(thumpGain);
        thumpGain.connect(masterGain);
        thump.start(now);
        thump.stop(now + 0.08);

        activeNotes.set(noteId, { envelope, oscillators });
    }

    function stopNote(noteId) {
        if (!ctx || !activeNotes.has(noteId)) return;

        const { envelope, oscillators } = activeNotes.get(noteId);
        const now = ctx.currentTime;
        const releaseTime = 1.2;

        try {
            envelope.gain.cancelScheduledValues(now);
            envelope.gain.setValueAtTime(Math.max(envelope.gain.value, 0.001), now);
            envelope.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
        } catch (e) {}

        oscillators.forEach(osc => { try { osc.stop(now + releaseTime + 0.05); } catch (e) {} });
        activeNotes.delete(noteId);
    }

    return { startNote, stopNote };
})();
