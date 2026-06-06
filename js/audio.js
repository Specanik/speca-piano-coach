/**
 * AudioEngine — multi-voice, low-latency piano synthesizer.
 *
 * ── CDN Piano Voices (free, high-quality) ────────────────────────────────
 *   salamander   Salamander Grand Piano v3  (CC BY 3.0, A.Holm)
 *                tonejs.github.io/audio/salamander/ — 30 samples, pitch-shifted
 *
 *   grand        Concert Grand Piano        (MusyngKite soundfont, gleitz MIT)
 *   bright       Bright Acoustic Piano      (MusyngKite)
 *   fluid_grand  Classical Grand Piano      (FluidR3_GM soundfont, gleitz MIT)
 *   egrand       Electric Grand Piano       (MusyngKite)
 *   honky        Honky-Tonk Piano           (MusyngKite)
 *   rhodes       Electric Piano 1 / Rhodes  (MusyngKite)
 *   wurlitzer    Electric Piano 2           (MusyngKite)
 *   harpsichord  Harpsichord                (MusyngKite)
 *   clavinet     Clavinet                   (MusyngKite)
 *   vibraphone   Vibraphone                 (MusyngKite)
 *   marimba      Marimba                    (MusyngKite)
 *
 * ── Synthesis Voices (zero latency, no CDN) ──────────────────────────────
 *   fm           FM Piano — DX7 style (carrier + high-ratio modulator)
 *   soft         Soft Piano — intimate Karplus-Strong + gentle envelope
 *   upright      Upright Piano — thumpy attack, shorter sustain
 *   organ        Hammond B3 Organ — drawbar additive synthesis
 *   strings      String Pad — detuned chorus sawtooth
 *   sine         Pure Sine — clearest for ear training
 *
 * ── Latency techniques ───────────────────────────────────────────────────
 *   • AudioContext({ latencyHint:'interactive' }) → ~5 ms buffer
 *   • Schedule at ctx.currentTime — zero scheduling overhead
 *   • prewarm() from first pointer interaction → no init-delay on first note
 *   • Lazy CDN load: Karplus-Strong bridges the gap on first press
 *   • Salamander: loads C4 area first (4 samples → playable in ~1 s)
 *
 * API:
 *   AudioEngine.startNote(id, midi, velocity?)
 *   AudioEngine.stopNote(id)
 *   AudioEngine.sustainOn() / sustainOff() / isSustainOn()
 *   AudioEngine.setVoice(id)   getVoice()   getVoices()
 *   AudioEngine.prewarm()
 *   AudioEngine.setVolume(0–1)
 *   AudioEngine.onVoiceChange(cb)   cb(voiceId, status)
 */
const AudioEngine = (() => {

    // ── AudioContext ──────────────────────────────────────────────────────
    let _ctx        = null;
    let _masterGain = null;

    function _ensureCtx() {
        if (_ctx) {
            if (_ctx.state === 'suspended') _ctx.resume();
            return;
        }
        const AC = window.AudioContext || /** @type {any} */(window).webkitAudioContext;
        _ctx = new AC({ latencyHint: 'interactive', sampleRate: 44100 });
        _masterGain = _ctx.createGain();
        _masterGain.gain.value = window.PianoConfig?.audio?.gainMaster ?? 0.85;
        _masterGain.connect(_ctx.destination);
        if (_ctx.state === 'suspended') _ctx.resume();
    }

    function prewarm() {
        _ensureCtx();
        const o = _ctx.createOscillator();
        const g = _ctx.createGain();
        g.gain.value = 0;
        o.connect(g); g.connect(_ctx.destination);
        o.start(); o.stop(_ctx.currentTime + 0.001);
    }

    // ── CDN base URLs ─────────────────────────────────────────────────────
    const CDN_SALAMANDER = 'https://tonejs.github.io/audio/salamander/';
    const CDN_MUSYNG     = 'https://gleitz.github.io/midi.js-soundfonts/MusyngKite/';
    const CDN_FLUID      = 'https://gleitz.github.io/midi.js-soundfonts/FluidR3_GM/';

    // Gleitz note name (flats): MIDI → 'C4', 'Db4', 'D4', 'Eb4' …
    const _GLEITZ = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
    const _gleitzName = midi =>
        _GLEITZ[midi % 12] + (Math.floor(midi / 12) - 1);

    // Salamander sample map: MIDI → filename stem (no ext)
    //  'Ds' = D♯, 'Fs' = F♯
    const SALAM_MAP = {
         21:'A0',   24:'C1',   27:'Ds1',  30:'Fs1',
         33:'A1',   36:'C2',   39:'Ds2',  42:'Fs2',
         45:'A2',   48:'C3',   51:'Ds3',  54:'Fs3',
         57:'A3',   60:'C4',   63:'Ds4',  66:'Fs4',
         69:'A4',   72:'C5',   75:'Ds5',  78:'Fs5',
         81:'A5',   84:'C6',   87:'Ds6',  90:'Fs6',
         93:'A6',   96:'C7',   99:'Ds7', 102:'Fs7',
        105:'A7',  108:'C8'
    };
    const SALAM_MIDIS = Object.keys(SALAM_MAP).map(Number).sort((a,b)=>a-b);

    // ── Voice catalogue ───────────────────────────────────────────────────
    //
    // type: 'salamander' | 'gleitz' | 'synth'
    //   gleitz fields: url (full base), rangeMin, rangeMax
    //   synth  fields: synthType ('fm'|'soft'|'upright'|'organ'|'strings'|'sine')
    //
    const VOICES = {
        // ── Grand Pianos — CDN ──────────────────────────────────────────
        salamander: {
            label: '🎹 Salamander',
            description: 'Salamander Grand Piano v3 (Alexander Holm, CC BY)',
            cat: 'Grand',
            type: 'salamander',
            releaseMs: 950,
        },
        grand: {
            label: '🎹 Concert Grand',
            description: 'Concert Grand Piano (MusyngKite, per-note)',
            cat: 'Grand',
            type: 'gleitz',
            url: CDN_MUSYNG + 'acoustic_grand_piano-mp3/',
            releaseMs: 1000,
            rangeMin: 21, rangeMax: 108,
        },
        fluid_grand: {
            label: '🎹 Classical Grand',
            description: 'Grand Piano classique FluidR3 (per-note)',
            cat: 'Grand',
            type: 'gleitz',
            url: CDN_FLUID + 'acoustic_grand_piano-mp3/',
            releaseMs: 950,
            rangeMin: 21, rangeMax: 108,
        },
        bright: {
            label: '🎹 Bright Piano',
            description: 'Bright Acoustic Piano — tone sáng, rõ tiếng (MusyngKite)',
            cat: 'Grand',
            type: 'gleitz',
            url: CDN_MUSYNG + 'bright_acoustic_piano-mp3/',
            releaseMs: 750,
            rangeMin: 21, rangeMax: 108,
        },
        // ── Electric Pianos — CDN ───────────────────────────────────────
        egrand: {
            label: '🎹 Electric Grand',
            description: 'Electric Grand Piano (MusyngKite)',
            cat: 'Electric',
            type: 'gleitz',
            url: CDN_MUSYNG + 'electric_grand_piano-mp3/',
            releaseMs: 700,
            rangeMin: 28, rangeMax: 103,
        },
        rhodes: {
            label: '🎵 Rhodes',
            description: 'Electric Piano Rhodes style (MusyngKite)',
            cat: 'Electric',
            type: 'gleitz',
            url: CDN_MUSYNG + 'electric_piano_1-mp3/',
            releaseMs: 650,
            rangeMin: 28, rangeMax: 103,
        },
        wurlitzer: {
            label: '🎵 Wurlitzer',
            description: 'Electric Piano Wurlitzer style (MusyngKite)',
            cat: 'Electric',
            type: 'gleitz',
            url: CDN_MUSYNG + 'electric_piano_2-mp3/',
            releaseMs: 580,
            rangeMin: 28, rangeMax: 103,
        },
        honky: {
            label: '🎹 Honky-Tonk',
            description: 'Honky-Tonk Piano — ragtime cổ điển (MusyngKite)',
            cat: 'Electric',
            type: 'gleitz',
            url: CDN_MUSYNG + 'honkytonk_piano-mp3/',
            releaseMs: 650,
            rangeMin: 21, rangeMax: 108,
        },
        // ── Keyboard special — CDN ──────────────────────────────────────
        harpsichord: {
            label: '🎻 Harpsichord',
            description: 'Harpsichord baroque (MusyngKite)',
            cat: 'Special',
            type: 'gleitz',
            url: CDN_MUSYNG + 'harpsichord-mp3/',
            releaseMs: 700,
            rangeMin: 29, rangeMax: 89,
        },
        clavinet: {
            label: '🎸 Clavinet',
            description: 'Clavinet funk/R&B (MusyngKite)',
            cat: 'Special',
            type: 'gleitz',
            url: CDN_MUSYNG + 'clavinet-mp3/',
            releaseMs: 280,
            rangeMin: 36, rangeMax: 96,
        },
        vibraphone: {
            label: '🔔 Vibraphone',
            description: 'Vibraphone — tone trong trẻo (MusyngKite)',
            cat: 'Special',
            type: 'gleitz',
            url: CDN_MUSYNG + 'vibraphone-mp3/',
            releaseMs: 1500,
            rangeMin: 53, rangeMax: 89,
        },
        marimba: {
            label: '🥁 Marimba',
            description: 'Marimba — gỗ ấm (MusyngKite)',
            cat: 'Special',
            type: 'gleitz',
            url: CDN_MUSYNG + 'marimba-mp3/',
            releaseMs: 360,
            rangeMin: 48, rangeMax: 84,
        },
        // ── Synthesis Pianos ────────────────────────────────────────────
        fm: {
            label: '⚡ FM Piano',
            description: 'FM Synthesis — Yamaha DX7 style, bell attack',
            cat: 'Synth',
            type: 'synth', synthType: 'fm',
            releaseMs: 700,
        },
        soft: {
            label: '🌙 Soft Piano',
            description: 'Close-miked piano — ấm dịu, nhẹ nhàng',
            cat: 'Synth',
            type: 'synth', synthType: 'soft',
            releaseMs: 1100,
        },
        upright: {
            label: '🎹 Upright',
            description: 'Upright piano vintage — thumpy, gọn',
            cat: 'Synth',
            type: 'synth', synthType: 'upright',
            releaseMs: 450,
        },
        organ: {
            label: '🎸 Organ',
            description: 'Hammond B3 Organ — additive drawbar synthesis',
            cat: 'Synth',
            type: 'synth', synthType: 'organ',
            releaseMs: 28,
        },
        strings: {
            label: '🎻 Strings',
            description: 'String Pad — detuned sawtooth chorus',
            cat: 'Synth',
            type: 'synth', synthType: 'strings',
            releaseMs: 600,
        },
        sine: {
            label: '✨ Sine',
            description: 'Sóng sin thuần khiết — lý thuyết âm nhạc',
            cat: 'Synth',
            type: 'synth', synthType: 'sine',
            releaseMs: 700,
        },
    };

    // ── Buffer + load state per voice ─────────────────────────────────────
    // _buffers['salamander'] = Map<sampleMidi, AudioBuffer>
    // _buffers['grand']      = Map<midi,       AudioBuffer>
    const _buffers   = {};
    const _loadState = {};   // 'loading' | 'partial' | 'ready'

    // ── Active notes + sustain ────────────────────────────────────────────
    const _active    = new Map();
    let _sustainOn   = false;
    const _sustained = new Map();

    // ── Current voice ─────────────────────────────────────────────────────
    let _voice         = localStorage.getItem('piano-voice') || 'salamander';
    let _voiceChangeCb = null;

    // ── Helpers ───────────────────────────────────────────────────────────
    const _freq = midi => 440 * Math.pow(2, (midi - 69) / 12);

    async function _fetchBuf(url) {
        _ensureCtx();
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        return _ctx.decodeAudioData(await res.arrayBuffer());
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SALAMANDER LOADING (30 samples, pitch-shifted)
    // ══════════════════════════════════════════════════════════════════════

    async function _loadSalamanderSample(midi) {
        if (!_buffers.salamander) _buffers.salamander = new Map();
        if (_buffers.salamander.has(midi)) return;
        try {
            const buf = await _fetchBuf(CDN_SALAMANDER + SALAM_MAP[midi] + '.mp3');
            _buffers.salamander.set(midi, buf);
        } catch { /* silent */ }
    }

    async function _loadSalamanderVoice() {
        if (_loadState.salamander) return;
        _loadState.salamander = 'loading';
        _voiceChangeCb?.('salamander', 'loading');

        // Priority: C4 area → expand outward
        const priority = [60, 48, 72, 57, 36, 84, 24, 96, 108]
            .filter(m => SALAM_MAP[m]);
        const rest = SALAM_MIDIS.filter(m => !priority.includes(m));

        let loaded = 0;
        for (const m of [...priority, ...rest]) {
            await _loadSalamanderSample(m);
            loaded++;
            if (loaded === 4) {
                _loadState.salamander = 'partial';
                _voiceChangeCb?.('salamander', 'partial');
            }
        }
        _loadState.salamander = 'ready';
        _voiceChangeCb?.('salamander', 'ready');
    }

    // ══════════════════════════════════════════════════════════════════════
    //   GLEITZ LOADING (per-note samples)
    // ══════════════════════════════════════════════════════════════════════

    async function _lazyLoadGleitz(vid, midi) {
        if (!_buffers[vid]) _buffers[vid] = new Map();
        if (_buffers[vid].has(midi)) return _buffers[vid].get(midi);

        const cfg  = VOICES[vid];
        const clamped = Math.max(cfg.rangeMin, Math.min(cfg.rangeMax, midi));
        const url  = cfg.url + _gleitzName(clamped) + '.mp3';
        try {
            const buf = await _fetchBuf(url);
            _buffers[vid].set(midi, buf);
            if (clamped !== midi) _buffers[vid].set(clamped, buf);
            return buf;
        } catch { return null; }
    }

    async function _warmGleitz(vid) {
        if (_loadState[vid]) return;
        _loadState[vid] = 'loading';
        _voiceChangeCb?.(vid, 'loading');
        const cfg = VOICES[vid];
        // Eager: C3–C5
        const eager = [];
        for (let m = 48; m <= 72; m++) {
            if (m >= cfg.rangeMin && m <= cfg.rangeMax) eager.push(m);
        }
        await Promise.all(eager.map(m => _lazyLoadGleitz(vid, m)));
        _loadState[vid] = 'partial';
        _voiceChangeCb?.(vid, 'partial');
        // Background: full range
        const all = [];
        for (let m = cfg.rangeMin; m <= cfg.rangeMax; m++) all.push(m);
        const rest = all.filter(m => m < 48 || m > 72);
        for (const m of rest) await _lazyLoadGleitz(vid, m);
        _loadState[vid] = 'ready';
        _voiceChangeCb?.(vid, 'ready');
    }

    // ══════════════════════════════════════════════════════════════════════
    //   PLAYBACK — SAMPLE
    // ══════════════════════════════════════════════════════════════════════

    function _playSalamanderNote(noteId, midi, velocity) {
        if (!_buffers.salamander?.size) return false;
        let best = -1, bestD = Infinity;
        for (const m of SALAM_MIDIS) {
            if (!_buffers.salamander.has(m)) continue;
            const d = Math.abs(midi - m);
            if (d < bestD) { bestD = d; best = m; }
        }
        if (best < 0) return false;

        const buf  = _buffers.salamander.get(best);
        const rate = Math.pow(2, (midi - best) / 12);
        return _playSampleBuf(noteId, midi, velocity, buf, rate);
    }

    function _playSampleBuf(noteId, midi, velocity, buf, rate = 1) {
        if (!buf) return false;
        const velGain = 0.38 + (velocity / 127) * 0.62;
        const now     = _ctx.currentTime;

        const src = _ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = rate;

        const env = _ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(velGain, now + 0.004);
        env.gain.exponentialRampToValueAtTime(velGain * 0.5, now + 0.25);

        src.connect(env); env.connect(_masterGain);
        src.start(now);
        _active.set(noteId, { type: 'sample', src, env, midi });
        return true;
    }

    function _releaseSample(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { src, env } = _active.get(noteId);
        const now = _ctx.currentTime, relS = releaseMs / 1000;
        try {
            env.gain.cancelScheduledValues(now);
            env.gain.setValueAtTime(Math.max(env.gain.value, 1e-5), now);
            env.gain.exponentialRampToValueAtTime(1e-5, now + relS);
            src.stop(now + relS + 0.02);
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — KARPLUS-STRONG (grand/soft/upright fallback)
    // ══════════════════════════════════════════════════════════════════════
    //
    // Feedback delay loop through a lowpass filter approximates a plucked
    // string. The result is far more convincing than a plain oscillator.

    function _startKS(noteId, midi, velocity, opts = {}) {
        _ensureCtx();
        const {
            decayGain   = 0.985 + (midi / 127) * 0.01,
            lpfFreq     = Math.min(6000, 900 + _freq(midi) * 2.2 + (velocity / 127) * 2200),
            velScale    = 0.35 + (velocity / 127) * 0.55,
            thumpAmt    = 0.30,
        } = opts;

        const freq = _freq(midi);
        const now  = _ctx.currentTime;

        // Master envelope
        const masterEnv = _ctx.createGain();
        masterEnv.gain.setValueAtTime(velScale, now);
        masterEnv.gain.exponentialRampToValueAtTime(1e-5, now + 7.0);
        masterEnv.connect(_masterGain);

        // Noise burst excitation
        const burstLen = Math.round(_ctx.sampleRate * 0.08);
        const nBuf     = _ctx.createBuffer(1, burstLen, _ctx.sampleRate);
        const nd       = nBuf.getChannelData(0);
        for (let i = 0; i < burstLen; i++)
            nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (burstLen * 0.25));
        const noise = _ctx.createBufferSource();
        noise.buffer = nBuf;

        // Delay + feedback loop
        const delay = _ctx.createDelay(2.0);
        delay.delayTime.value = Math.max(1 / freq, 1 / _ctx.sampleRate);
        const lpf  = _ctx.createBiquadFilter();
        lpf.type   = 'lowpass';
        lpf.frequency.value = lpfFreq;
        lpf.Q.value = 0.35;
        const fb   = _ctx.createGain();
        fb.gain.value = decayGain;

        // String body — slight formant at fundamental
        const body = _ctx.createBiquadFilter();
        body.type  = 'peaking';
        body.frequency.value = freq;
        body.gain.value  = 2.5;
        body.Q.value     = 1.8;

        // signal flow: noise → delay → lpf → fb → delay (loop)
        //                              lpf → body → masterEnv → out
        noise.connect(delay);
        delay.connect(lpf);
        lpf.connect(fb);
        fb.connect(delay);
        lpf.connect(body);
        body.connect(masterEnv);

        noise.start(now);
        noise.stop(now + 0.08);

        // Hammer thump transient
        if (thumpAmt > 0) {
            const thOsc = _ctx.createOscillator();
            const thG   = _ctx.createGain();
            thOsc.type  = 'sine';
            thOsc.frequency.setValueAtTime(freq * 0.5, now);
            thOsc.frequency.exponentialRampToValueAtTime(50, now + 0.04);
            thG.gain.setValueAtTime(velScale * thumpAmt, now);
            thG.gain.exponentialRampToValueAtTime(1e-5, now + 0.055);
            thOsc.connect(thG); thG.connect(_masterGain);
            thOsc.start(now); thOsc.stop(now + 0.07);
        }

        _active.set(noteId, { type: 'ks', masterEnv, fb, midi });
    }

    function _releaseKS(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { masterEnv, fb } = _active.get(noteId);
        const now = _ctx.currentTime, relS = releaseMs / 1000;
        try {
            masterEnv.gain.cancelScheduledValues(now);
            masterEnv.gain.setValueAtTime(Math.max(masterEnv.gain.value, 1e-5), now);
            masterEnv.gain.exponentialRampToValueAtTime(1e-5, now + relS);
            fb.gain.setValueAtTime(fb.gain.value, now);
            fb.gain.linearRampToValueAtTime(0, now + relS * 0.4);
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — FM PIANO (Yamaha DX7 Algorithm 5 inspired)
    // ══════════════════════════════════════════════════════════════════════
    //
    // Carrier (ratio 1:1) + Modulator (ratio 14:1)
    // The high-ratio modulator creates the characteristic metallic bell transient.
    // Modulation index decays rapidly → from bright attack to mellow sustain.

    function _startFM(noteId, midi, velocity) {
        _ensureCtx();
        const freq    = _freq(midi);
        const velGain = 0.3 + (velocity / 127) * 0.6;
        const now     = _ctx.currentTime;

        // Carrier oscillator (fundamental)
        const carOsc = _ctx.createOscillator();
        carOsc.type  = 'sine';
        carOsc.frequency.value = freq;

        // Modulator oscillator (ratio 14 = DX7 E.Piano bell transient)
        const modOsc = _ctx.createOscillator();
        modOsc.type  = 'sine';
        modOsc.frequency.value = freq * 14;

        // Modulation amount → drives carrier.frequency (FM)
        const modAmt   = _ctx.createGain();
        const modPeak  = freq * (velocity / 127) * 18;  // velocity = brightness
        modAmt.gain.setValueAtTime(modPeak, now);
        modAmt.gain.exponentialRampToValueAtTime(freq * 0.6, now + 0.015);
        modAmt.gain.exponentialRampToValueAtTime(freq * 0.04, now + 0.25);
        modAmt.gain.linearRampToValueAtTime(0, now + 0.9);

        modOsc.connect(modAmt);
        modAmt.connect(carOsc.frequency);   // FM!

        // Carrier amplitude envelope
        const carEnv = _ctx.createGain();
        carEnv.gain.setValueAtTime(0, now);
        carEnv.gain.linearRampToValueAtTime(velGain, now + 0.004);
        carEnv.gain.exponentialRampToValueAtTime(velGain * 0.55, now + 0.1);
        carEnv.gain.exponentialRampToValueAtTime(velGain * 0.22, now + 1.0);
        carEnv.gain.exponentialRampToValueAtTime(1e-5, now + 5.5);

        carOsc.connect(carEnv); carEnv.connect(_masterGain);
        modOsc.start(now); carOsc.start(now);

        _active.set(noteId, { type: 'fm', carOsc, modOsc, carEnv, modAmt, midi });
    }

    function _releaseFM(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { carOsc, modOsc, carEnv } = _active.get(noteId);
        const now = _ctx.currentTime, relS = releaseMs / 1000;
        try {
            carEnv.gain.cancelScheduledValues(now);
            carEnv.gain.setValueAtTime(Math.max(carEnv.gain.value, 1e-5), now);
            carEnv.gain.exponentialRampToValueAtTime(1e-5, now + relS);
            carOsc.stop(now + relS + 0.02);
            modOsc.stop(now + relS + 0.02);
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — SOFT PIANO (intimate, close-miked character)
    // ══════════════════════════════════════════════════════════════════════

    function _startSoft(noteId, midi, velocity) {
        // KS with more damping, very soft attack noise, long release
        _startKS(noteId, midi, velocity, {
            decayGain: 0.978 + (midi / 127) * 0.008,
            lpfFreq:   Math.min(3500, 500 + _freq(midi) * 1.5 + (velocity / 127) * 1000),
            velScale:  0.28 + (velocity / 127) * 0.42,
            thumpAmt:  0.08,  // very gentle thump
        });
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — UPRIGHT PIANO (short sustain, thumpy attack)
    // ══════════════════════════════════════════════════════════════════════

    function _startUpright(noteId, midi, velocity) {
        _ensureCtx();
        const freq    = _freq(midi);
        const velGain = 0.38 + (velocity / 127) * 0.52;
        const now     = _ctx.currentTime;

        // Shorter decay than grand (felt dampers)
        const masterEnv = _ctx.createGain();
        masterEnv.gain.setValueAtTime(velGain, now);
        masterEnv.gain.exponentialRampToValueAtTime(velGain * 0.4, now + 0.15);
        masterEnv.gain.exponentialRampToValueAtTime(velGain * 0.1, now + 0.7);
        masterEnv.gain.exponentialRampToValueAtTime(1e-5, now + 2.5);
        masterEnv.connect(_masterGain);

        // KS core
        const delay = _ctx.createDelay(2.0);
        delay.delayTime.value = Math.max(1 / freq, 1 / _ctx.sampleRate);
        const lpf  = _ctx.createBiquadFilter();
        lpf.type   = 'lowpass';
        lpf.frequency.value = Math.min(3800, 700 + freq * 1.8);
        lpf.Q.value = 0.25;
        const fb   = _ctx.createGain();
        fb.gain.value = 0.970 + (midi / 127) * 0.008;

        const burstLen = Math.round(_ctx.sampleRate * 0.06);
        const nBuf = _ctx.createBuffer(1, burstLen, _ctx.sampleRate);
        const nd   = nBuf.getChannelData(0);
        for (let i = 0; i < burstLen; i++)
            nd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (burstLen * 0.18));
        const noise = _ctx.createBufferSource();
        noise.buffer = nBuf;

        noise.connect(delay);
        delay.connect(lpf); lpf.connect(fb); fb.connect(delay);
        lpf.connect(masterEnv);
        noise.start(now); noise.stop(now + 0.07);

        // Thumpy hammer: more pronounced than grand
        const thOsc = _ctx.createOscillator();
        const thG   = _ctx.createGain();
        thOsc.type  = 'triangle';
        thOsc.frequency.setValueAtTime(freq * 0.7, now);
        thOsc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
        thG.gain.setValueAtTime(velGain * 0.55, now);
        thG.gain.exponentialRampToValueAtTime(1e-5, now + 0.07);
        thOsc.connect(thG); thG.connect(_masterGain);
        thOsc.start(now); thOsc.stop(now + 0.09);

        _active.set(noteId, { type: 'ks', masterEnv, fb, midi });
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — HAMMOND ORGAN
    // ══════════════════════════════════════════════════════════════════════

    const ORGAN_DRAWBARS = [
        [0.5, 0.12], [1, 0.80], [1.5, 0.14],
        [2, 0.55],   [3, 0.10], [4, 0.10],
    ];

    function _startOrgan(noteId, midi, velocity) {
        _ensureCtx();
        const freq    = _freq(midi);
        const velGain = 0.28 + (velocity / 127) * 0.22;
        const now     = _ctx.currentTime;

        const master  = _ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(velGain, now + 0.012);

        // Soft overdrive
        const shaper = _ctx.createWaveShaper();
        const curve  = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = Math.tanh(x * 1.4);
        }
        shaper.curve = curve;
        shaper.connect(master); master.connect(_masterGain);

        const oscs = ORGAN_DRAWBARS.map(([ratio, amp]) => {
            const osc = _ctx.createOscillator();
            const g   = _ctx.createGain();
            osc.type  = 'sine';
            osc.frequency.value = freq * ratio;
            g.gain.value = amp;
            osc.connect(g); g.connect(shaper);
            osc.start(now);
            return osc;
        });
        _active.set(noteId, { type: 'organ', master, oscs, midi });
    }

    function _releaseOrgan(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { master, oscs } = _active.get(noteId);
        const now = _ctx.currentTime, relS = Math.max(releaseMs / 1000, 0.025);
        try {
            master.gain.cancelScheduledValues(now);
            master.gain.setValueAtTime(Math.max(master.gain.value, 1e-5), now);
            master.gain.linearRampToValueAtTime(0, now + relS);
            oscs.forEach(o => { try { o.stop(now + relS + 0.01); } catch {} });
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — STRING PAD
    // ══════════════════════════════════════════════════════════════════════

    function _startStrings(noteId, midi, velocity) {
        _ensureCtx();
        const freq    = _freq(midi);
        const velGain = 0.28 + (velocity / 127) * 0.38;
        const now     = _ctx.currentTime;

        const env = _ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(velGain, now + 0.18);

        const lpf = _ctx.createBiquadFilter();
        lpf.type  = 'lowpass';
        lpf.frequency.value = 1600 + freq * 0.4;
        lpf.Q.value = 0.5;
        env.connect(lpf); lpf.connect(_masterGain);

        const oscs = [-4, 0, 4].map(detune => {
            const osc = _ctx.createOscillator();
            const g   = _ctx.createGain();
            osc.type  = 'sawtooth';
            osc.frequency.value = freq * Math.pow(2, detune / 1200);
            g.gain.value = 0.33;
            osc.connect(g); g.connect(env);
            osc.start(now);
            return osc;
        });
        _active.set(noteId, { type: 'strings', env, oscs, midi });
    }

    function _releaseStrings(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { env, oscs } = _active.get(noteId);
        const now = _ctx.currentTime, relS = releaseMs / 1000;
        try {
            env.gain.cancelScheduledValues(now);
            env.gain.setValueAtTime(Math.max(env.gain.value, 1e-5), now);
            env.gain.exponentialRampToValueAtTime(1e-5, now + relS);
            oscs.forEach(o => { try { o.stop(now + relS + 0.05); } catch {} });
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   SYNTHESIS — PURE SINE
    // ══════════════════════════════════════════════════════════════════════

    function _startSine(noteId, midi, velocity) {
        _ensureCtx();
        const freq    = _freq(midi);
        const velGain = 0.32 + (velocity / 127) * 0.44;
        const now     = _ctx.currentTime;

        const osc = _ctx.createOscillator();
        osc.type  = 'sine';
        osc.frequency.value = freq;

        const env = _ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(velGain, now + 0.006);
        env.gain.exponentialRampToValueAtTime(velGain * 0.5, now + 0.3);

        osc.connect(env); env.connect(_masterGain);
        osc.start(now);
        _active.set(noteId, { type: 'sine', osc, env, midi });
    }

    function _releaseSine(noteId, releaseMs) {
        if (!_active.has(noteId)) return;
        const { osc, env } = _active.get(noteId);
        const now = _ctx.currentTime, relS = releaseMs / 1000;
        try {
            env.gain.cancelScheduledValues(now);
            env.gain.setValueAtTime(Math.max(env.gain.value, 1e-5), now);
            env.gain.exponentialRampToValueAtTime(1e-5, now + relS);
            osc.stop(now + relS + 0.02);
        } catch {}
        _active.delete(noteId);
    }

    // ══════════════════════════════════════════════════════════════════════
    //   INTERNAL STOP (no sustain logic)
    // ══════════════════════════════════════════════════════════════════════

    function _doStop(noteId) {
        if (!_active.has(noteId)) return;
        const entry = _active.get(noteId);
        const rel   = (VOICES[_voice]?.releaseMs) ?? 500;

        switch (entry.type) {
            case 'sample':  _releaseSample(noteId, rel);  break;
            case 'ks':      _releaseKS(noteId, rel);      break;
            case 'fm':      _releaseFM(noteId, rel);      break;
            case 'organ':   _releaseOrgan(noteId, rel);   break;
            case 'strings': _releaseStrings(noteId, rel); break;
            case 'sine':    _releaseSine(noteId, rel);    break;
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    //   PUBLIC API
    // ══════════════════════════════════════════════════════════════════════

    function startNote(noteId, midi, velocity = 90) {
        _ensureCtx();
        _sustained.delete(noteId);

        const cfg = VOICES[_voice];
        if (!cfg) return;

        if (cfg.type === 'synth') {
            switch (cfg.synthType) {
                case 'fm':      _startFM(noteId, midi, velocity);      break;
                case 'soft':    _startSoft(noteId, midi, velocity);    break;
                case 'upright': _startUpright(noteId, midi, velocity); break;
                case 'organ':   _startOrgan(noteId, midi, velocity);   break;
                case 'strings': _startStrings(noteId, midi, velocity); break;
                default:        _startSine(noteId, midi, velocity);    break;
            }
            return;
        }

        if (cfg.type === 'salamander') {
            if (!_playSalamanderNote(noteId, midi, velocity)) {
                _startKS(noteId, midi, velocity);
                if (!_loadState.salamander) _loadSalamanderVoice();
            }
            return;
        }

        if (cfg.type === 'gleitz') {
            const cached = _buffers[_voice]?.get(midi);
            if (cached) {
                _playSampleBuf(noteId, midi, velocity, cached);
            } else {
                _startKS(noteId, midi, velocity);
                _lazyLoadGleitz(_voice, midi);  // cached for next press
                if (!_loadState[_voice]) _warmGleitz(_voice);
            }
        }
    }

    function stopNote(noteId) {
        if (!_active.has(noteId)) return;
        if (_sustainOn) { _sustained.set(noteId, true); return; }
        _doStop(noteId);
    }

    // ── Sustain pedal ──────────────────────────────────────────────────
    function sustainOn()  { _sustainOn = true; }

    function sustainOff() {
        _sustainOn = false;
        _sustained.forEach((_, id) => _doStop(id));
        _sustained.clear();
    }

    function isSustainOn() { return _sustainOn; }

    // ── Voice management ───────────────────────────────────────────────
    function setVoice(name) {
        if (!VOICES[name]) return;
        _voice = name;
        localStorage.setItem('piano-voice', name);
        _voiceChangeCb?.(name, _loadState[name] || 'idle');

        const cfg = VOICES[name];
        if (cfg.type === 'salamander' && !_loadState.salamander) {
            _loadSalamanderVoice();
        } else if (cfg.type === 'gleitz' && !_loadState[name]) {
            _warmGleitz(name);
        }
    }

    function getVoice()  { return _voice; }

    function getVoices() {
        return Object.entries(VOICES).map(([id, v]) => ({
            id,
            label:       v.label,
            description: v.description,
            cat:         v.cat,
            status:      _loadState[id] || (v.type === 'synth' ? 'ready' : 'idle'),
        }));
    }

    // ── Volume + misc ──────────────────────────────────────────────────
    function setVolume(v) {
        _ensureCtx();
        _masterGain.gain.setTargetAtTime(
            Math.max(0, Math.min(1, v)), _ctx.currentTime, 0.01
        );
    }

    function onVoiceChange(cb) { _voiceChangeCb = cb; }
    function isUsingSamples()  { return !!_loadState[_voice]; }

    // Legacy compat
    async function loadSamples() {
        await _loadSalamanderVoice();
        return _loadState.salamander === 'ready';
    }

    // Pre-warm on first pointer interaction
    document.addEventListener('pointerdown', () => prewarm(), { once: true });

    // Kick off loading the default voice immediately — no delay.
    // Original 300ms setTimeout caused audible silence on first note press.
    if (VOICES[_voice]?.type !== 'synth') {
        // Use microtask so the IIFE finishes binding its exports first.
        Promise.resolve().then(() => setVoice(_voice));
    }

    return {
        startNote, stopNote,
        sustainOn, sustainOff, isSustainOn,
        setVoice, getVoice, getVoices, onVoiceChange,
        prewarm, setVolume, loadSamples, isUsingSamples,
    };
})();
