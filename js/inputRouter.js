/**
 * InputRouter — unified note event bus.
 *
 * Ba nguồn input:
 *   • Keyboard  (PC keyboard — Keyboard module)
 *   • MIDI      (hardware piano — MidiInput module, với velocity + sustain)
 *   • Mic       (pitch detection — PitchDetector module)
 *
 * Consumers đăng ký một cặp callback, không cần biết nguồn:
 *   InputRouter.onNoteOn(cb)      cb(midi, velocity)
 *   InputRouter.onNoteOff(cb)     cb(midi)
 *   InputRouter.onStateChange(cb) cb(state)  — multi-listener
 *
 * Source management:
 *   InputRouter.enableMidi()   → Promise<bool>
 *   InputRouter.disableMidi()
 *   InputRouter.enableMic()    → Promise<bool>
 *   InputRouter.disableMic()
 *   InputRouter.getState()     → { midi, mic, midiDevices, sustainOn }
 */
const InputRouter = (() => {
    let _onNoteOn  = null;
    let _onNoteOff = null;
    const _stateListeners = [];   // multiple subscribers (MidiTester, DevMode, AppShell…)

    const state = {
        midi:        false,
        mic:         false,
        midiDevices: [],
        sustainOn:   false,
    };

    // ── Internal emit helpers ──────────────────────────────────────────────
    function emitNoteOn(midi, velocity = 80)  { _onNoteOn  && _onNoteOn(midi, velocity);  }
    function emitNoteOff(midi)                { _onNoteOff && _onNoteOff(midi); }

    function emitState() {
        const s = { ...state };
        _stateListeners.forEach(cb => cb(s));
    }

    // ── Keyboard (always active, velocity from settings or default 80) ────
    function attachKeyboard() {
        if (typeof Keyboard === 'undefined') return;
        Keyboard.onNoteOnHandler(midi => {
            const vel = window.SettingsPanel?.get('keyboardVelocity') ?? 80;
            emitNoteOn(midi, vel);
        });
        Keyboard.onNoteOffHandler(midi => emitNoteOff(midi));
    }

    // ── MIDI ───────────────────────────────────────────────────────────────
    async function enableMidi() {
        if (typeof MidiInput === 'undefined') return false;

        // Prewarm AudioContext sebelum connect agar tidak ada init-delay di note pertama
        if (typeof AudioEngine !== 'undefined') AudioEngine.prewarm();

        MidiInput.onNoteOn((midi, velocity) => emitNoteOn(midi, velocity));
        MidiInput.onNoteOff(midi => emitNoteOff(midi));

        // Sustain pedal → AudioEngine trực tiếp (bypass routing để tối thiểu latency)
        MidiInput.onSustain(isOn => {
            state.sustainOn = isOn;
            if (typeof AudioEngine !== 'undefined') {
                isOn ? AudioEngine.sustainOn() : AudioEngine.sustainOff();
            }
            emitState();
        });

        MidiInput.onStatusChange(({ connected, devices }) => {
            state.midi        = connected;
            state.midiDevices = devices;
            emitState();
        });

        const ok = await MidiInput.connect();
        state.midi        = ok && MidiInput.getDevices().length > 0;
        state.midiDevices = MidiInput.getDevices();
        emitState();
        return ok;
    }

    function disableMidi() {
        if (typeof MidiInput === 'undefined') return;
        // Release sustain if held when disconnecting
        if (state.sustainOn && typeof AudioEngine !== 'undefined') {
            AudioEngine.sustainOff();
        }
        MidiInput.disconnect();
        state.midi        = false;
        state.midiDevices = [];
        state.sustainOn   = false;
        emitState();
    }

    // ── Mic ────────────────────────────────────────────────────────────────
    async function enableMic() {
        if (typeof PitchDetector === 'undefined') return false;
        PitchDetector.onNoteOn(midi  => emitNoteOn(midi, 80));
        PitchDetector.onNoteOff(midi => emitNoteOff(midi));
        const ok = await PitchDetector.start();
        state.mic = ok;
        emitState();
        return ok;
    }

    function disableMic() {
        if (typeof PitchDetector === 'undefined') return;
        PitchDetector.stop();
        state.mic = false;
        emitState();
    }

    return {
        attachKeyboard,
        enableMidi,
        disableMidi,
        enableMic,
        disableMic,
        getState:     () => ({ ...state }),
        onNoteOn:     cb => { _onNoteOn  = cb; },
        onNoteOff:    cb => { _onNoteOff = cb; },
        onStateChange:cb => { if (cb) _stateListeners.push(cb); },
    };
})();
