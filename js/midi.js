/**
 * MidiInput — wraps Web MIDI API, emits noteOn/noteOff events.
 * Falls back gracefully when API is unavailable (desktop Chrome/Edge support it;
 * Firefox/Safari require a flag or polyfill).
 *
 * Usage:
 *   MidiInput.onNoteOn(midi  => { ... })
 *   MidiInput.onNoteOff(midi => { ... })
 *   MidiInput.connect()          // request MIDI access
 *   MidiInput.isSupported()      // true if Web MIDI API exists
 *   MidiInput.getDevices()       // array of { id, name } currently connected
 */
const MidiInput = (() => {
    let _onNoteOn  = null;
    let _onNoteOff = null;
    let _midiAccess = null;
    let _statusCallback = null;   // called with { connected: bool, devices: [] }

    // ── MIDI message constants ──────────────────────────────────────────────
    const NOTE_ON  = 0x90;
    const NOTE_OFF = 0x80;

    function isSupported() {
        return typeof navigator !== 'undefined' && !!navigator.requestMIDIAccess;
    }

    function getDevices() {
        if (!_midiAccess) return [];
        const devices = [];
        _midiAccess.inputs.forEach(input => {
            devices.push({ id: input.id, name: input.name, state: input.state });
        });
        return devices;
    }

    function _broadcastStatus() {
        if (_statusCallback) {
            _statusCallback({
                connected: getDevices().length > 0,
                devices: getDevices()
            });
        }
    }

    function _handleMessage(event) {
        const [statusByte, note, velocity] = event.data;
        const type = statusByte & 0xF0;  // strip channel nibble

        if (type === NOTE_ON && velocity > 0) {
            _onNoteOn && _onNoteOn(note);
        } else if (type === NOTE_OFF || (type === NOTE_ON && velocity === 0)) {
            _onNoteOff && _onNoteOff(note);
        }
    }

    function _bindAllInputs() {
        if (!_midiAccess) return;
        _midiAccess.inputs.forEach(input => {
            input.onmidimessage = _handleMessage;
        });
    }

    async function connect() {
        if (!isSupported()) {
            console.warn('[MidiInput] Web MIDI API not supported in this browser.');
            return false;
        }
        try {
            _midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            _bindAllInputs();
            _broadcastStatus();

            // Re-bind when devices are plugged/unplugged
            _midiAccess.onstatechange = () => {
                _bindAllInputs();
                _broadcastStatus();
            };

            return true;
        } catch (err) {
            console.warn('[MidiInput] MIDI access denied:', err);
            return false;
        }
    }

    function disconnect() {
        if (!_midiAccess) return;
        _midiAccess.inputs.forEach(input => { input.onmidimessage = null; });
        _midiAccess = null;
        _broadcastStatus();
    }

    return {
        connect,
        disconnect,
        isSupported,
        getDevices,
        onNoteOn:       cb => { _onNoteOn       = cb; },
        onNoteOff:      cb => { _onNoteOff      = cb; },
        onStatusChange: cb => { _statusCallback = cb; },
    };
})();
