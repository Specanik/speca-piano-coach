/**
 * InputRouter — single unified source of truth for all note events.
 *
 * Three input sources feed into one pair of handlers:
 *   • Keyboard (PC keyboard via Keyboard module)
 *   • MIDI     (hardware piano via MidiInput module)
 *   • Mic      (pitch detection via PitchDetector module)
 *
 * Consumers register ONE pair of callbacks and never care about the source:
 *   InputRouter.onNoteOn(midi  => { ... })
 *   InputRouter.onNoteOff(midi => { ... })
 *
 * Source management:
 *   InputRouter.enableMidi()        → Promise<bool>
 *   InputRouter.enableMic()         → Promise<bool>
 *   InputRouter.disableMidi()
 *   InputRouter.disableMic()
 *   InputRouter.getState()          → { midi, mic, midiDevices }
 *   InputRouter.onStateChange(cb)   → cb(state) whenever a source toggles
 */
const InputRouter = (() => {
    let _onNoteOn    = null;
    let _onNoteOff   = null;
    let _onStateChange = null;

    const state = {
        midi:        false,
        mic:         false,
        midiDevices: []
    };

    // ── Internal emit helpers ──────────────────────────────────────────────
    function emitNoteOn(midi)  { _onNoteOn  && _onNoteOn(midi);  }
    function emitNoteOff(midi) { _onNoteOff && _onNoteOff(midi); }

    function emitState() {
        _onStateChange && _onStateChange({ ...state });
    }

    // ── Wire up keyboard (always active) ──────────────────────────────────
    // Keyboard module already emits events; we re-route them here.
    // Called once during app init after Keyboard is ready.
    function attachKeyboard() {
        if (typeof Keyboard === 'undefined') return;
        Keyboard.onNoteOnHandler(emitNoteOn);
        Keyboard.onNoteOffHandler(emitNoteOff);
    }

    // ── MIDI source ────────────────────────────────────────────────────────
    async function enableMidi() {
        if (typeof MidiInput === 'undefined') return false;

        MidiInput.onNoteOn(emitNoteOn);
        MidiInput.onNoteOff(emitNoteOff);
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
        MidiInput.disconnect();
        state.midi        = false;
        state.midiDevices = [];
        emitState();
    }

    // ── Mic source ─────────────────────────────────────────────────────────
    async function enableMic() {
        if (typeof PitchDetector === 'undefined') return false;

        PitchDetector.onNoteOn(emitNoteOn);
        PitchDetector.onNoteOff(emitNoteOff);

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
        getState: () => ({ ...state }),
        onNoteOn:     cb => { _onNoteOn     = cb; },
        onNoteOff:    cb => { _onNoteOff    = cb; },
        onStateChange:cb => { _onStateChange = cb; },
    };
})();
