/**
 * MidiInput — wraps Web MIDI API, emits noteOn/noteOff/sustain events.
 *
 * Supported MIDI messages:
 *   • NOTE_ON  (0x90) velocity > 0  → onNoteOn(midi, velocity)
 *   • NOTE_ON  (0x90) velocity = 0  → onNoteOff(midi)   (running status)
 *   • NOTE_OFF (0x80)               → onNoteOff(midi)
 *   • CC 64    (0xB0, 64, value)    → onSustain(bool)   sustain pedal
 *
 * API:
 *   MidiInput.connect()           request MIDI access
 *   MidiInput.disconnect()
 *   MidiInput.isSupported()
 *   MidiInput.getDevices()        → [{ id, name, state }]
 *   MidiInput.onNoteOn(cb)        cb(midi, velocity)
 *   MidiInput.onNoteOff(cb)       cb(midi)
 *   MidiInput.onSustain(cb)       cb(isOn: boolean)
 *   MidiInput.onStatusChange(cb)  cb({ connected, devices })
 */
const MidiInput = (() => {
    let _onNoteOn       = null;
    let _onNoteOff      = null;
    let _onSustain      = null;
    let _onStatusChange = null;
    let _midiAccess     = null;

    // MIDI status byte types (upper nibble)
    const NOTE_OFF       = 0x80;
    const NOTE_ON        = 0x90;
    const CONTROL_CHANGE = 0xB0;

    // CC numbers
    const CC_SUSTAIN = 64;

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
        if (_onStatusChange) {
            _onStatusChange({ connected: getDevices().length > 0, devices: getDevices() });
        }
    }

    function _handleMessage(event) {
        const data = event.data;
        if (!data || data.length < 2) return;

        const status   = data[0];
        const type     = status & 0xF0;   // strip channel nibble
        const note     = data[1];
        const velocity = data.length > 2 ? data[2] : 0;

        if (type === NOTE_ON && velocity > 0) {
            _onNoteOn && _onNoteOn(note, velocity);
        } else if (type === NOTE_OFF || (type === NOTE_ON && velocity === 0)) {
            _onNoteOff && _onNoteOff(note);
        } else if (type === CONTROL_CHANGE) {
            if (note === CC_SUSTAIN) {
                // CC 64: value >= 64 = pedal down, < 64 = pedal up
                _onSustain && _onSustain(velocity >= 64);
            }
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
            console.warn('[MidiInput] Web MIDI API not supported.');
            return false;
        }
        try {
            _midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            _bindAllInputs();
            _broadcastStatus();

            _midiAccess.onstatechange = () => {
                _bindAllInputs();
                _broadcastStatus();
            };

            return true;
        } catch (err) {
            console.warn('[MidiInput] Access denied:', err);
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
        onSustain:      cb => { _onSustain      = cb; },
        onStatusChange: cb => { _onStatusChange = cb; },
    };
})();
