const Keyboard = (() => {
    const WKW      = 40;  // white key width (px)
    const BKW      = 24;  // black key width (px)
    const CANVAS_H = 220; // visualizer height (px)

    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    const LAYOUTS = {
        '36': { start: 48,  end: 83  },  // C3  – B5
        '61': { start: 24,  end: 84  },  // C1  – C6
        '76': { start: 28,  end: 103 },  // E1  – G6
        '88': { start: 21,  end: 108 },  // A0  – C8
    };

    const KEY_MAP = {
        'z': 60, 's': 61, 'x': 62, 'd': 63, 'c': 64,
        'v': 65, 'g': 66, 'b': 67, 'h': 68, 'n': 69, 'j': 70, 'm': 71,
        'q': 72, '2': 73, 'w': 74, '3': 75, 'e': 76,
        'r': 77, '5': 78, 't': 79, '6': 80, 'y': 81, '7': 82, 'u': 83,
    };

    const MIDI_TO_KEY = Object.fromEntries(
        Object.entries(KEY_MAP).map(([k, v]) => [v, k.toUpperCase()])
    );

    let onNoteOn  = null;
    let onNoteOff = null;
    let mouseIsDown = false;
    const heldKeys  = new Set();

    // ── document-level listeners registered once ──────────────────────────
    document.addEventListener('mouseup', () => {
        if (!mouseIsDown) return;
        mouseIsDown = false;
        document.querySelectorAll('.piano [data-midi].active').forEach(el => {
            el.classList.remove('active');
            onNoteOff && onNoteOff(+el.dataset.midi);
        });
    });

    document.addEventListener('keydown', e => {
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
        const midi = KEY_MAP[e.key.toLowerCase()];
        if (midi === undefined || heldKeys.has(midi)) return;
        heldKeys.add(midi);
        pressKey(midi);
    });

    document.addEventListener('keyup', e => {
        const midi = KEY_MAP[e.key.toLowerCase()];
        if (midi === undefined) return;
        heldKeys.delete(midi);
        releaseKey(midi);
    });
    // ──────────────────────────────────────────────────────────────────────

    function pressKey(midi) {
        const el = document.querySelector(`[data-midi="${midi}"]`);
        if (!el || el.classList.contains('active')) return;
        el.classList.add('active');
        onNoteOn && onNoteOn(midi);
    }

    function releaseKey(midi) {
        const el = document.querySelector(`[data-midi="${midi}"]`);
        if (!el) return;
        el.classList.remove('active');
        onNoteOff && onNoteOff(midi);
    }

    function getNotesForLayout(layoutKey) {
        const { start, end } = LAYOUTS[layoutKey] || LAYOUTS['36'];
        const notes = [];
        for (let midi = start; midi <= end; midi++) {
            const idx    = midi % 12;
            const octave = Math.floor(midi / 12) - 1;
            const name   = NOTE_NAMES[idx];
            notes.push({ name, octave, midi, isBlack: name.includes('#') });
        }
        return notes;
    }

    function render(containerId, layoutKey = '36') {
        // Reset interaction state for the new layout
        mouseIsDown = false;
        heldKeys.clear();

        const container = document.getElementById(containerId);
        container.innerHTML = '';

        const notes      = getNotesForLayout(layoutKey);
        const whiteCount = notes.filter(n => !n.isBlack).length;
        const totalWidth = whiteCount * WKW;

        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'piano-wrapper';

        // Visualizer canvas
        const canvas = document.createElement('canvas');
        canvas.className  = 'visualizer';
        canvas.width      = totalWidth;
        canvas.height     = CANVAS_H;
        canvas.style.width  = totalWidth + 'px';
        canvas.style.height = CANVAS_H + 'px';
        wrapper.appendChild(canvas);

        // Piano keys
        const piano = document.createElement('div');
        piano.className = 'piano';

        let whiteIdx = -1;
        const noteMap = {};

        notes.forEach(note => {
            const el       = document.createElement('div');
            const shortcut = MIDI_TO_KEY[note.midi];

            if (!note.isBlack) {
                whiteIdx++;
                el.className  = 'key-white' + (note.name === 'C' ? ' octave-start' : '');
                el.dataset.midi = note.midi;

                const label = document.createElement('span');
                label.className = 'key-label';
                if (note.name === 'C') {
                    label.innerHTML = `<span class="note-name">${note.name}${note.octave}</span>`;
                }
                if (shortcut) {
                    label.innerHTML += `<span class="key-shortcut-label">${shortcut}</span>`;
                }
                el.appendChild(label);
                piano.appendChild(el);

                noteMap[note.midi] = {
                    xCenter: whiteIdx * WKW + WKW / 2,
                    width: WKW,
                    isBlack: false,
                };
            } else {
                el.className    = 'key-black';
                el.dataset.midi = note.midi;
                el.style.left   = `${(whiteIdx + 1) * WKW - BKW / 2}px`;
                piano.appendChild(el);

                noteMap[note.midi] = {
                    xCenter: (whiteIdx + 1) * WKW,
                    width: BKW,
                    isBlack: true,
                };
            }
        });

        wrapper.appendChild(piano);
        container.appendChild(wrapper);
        attachPianoEvents(piano);

        return { canvas, noteMap };
    }

    function attachPianoEvents(piano) {
        // Mouse
        piano.addEventListener('mousedown', e => {
            const key = e.target.closest('[data-midi]');
            if (!key) return;
            e.preventDefault();
            mouseIsDown = true;
            pressKey(+key.dataset.midi);
        });

        piano.addEventListener('mouseover', e => {
            if (!mouseIsDown) return;
            const key = e.target.closest('[data-midi]');
            if (key) pressKey(+key.dataset.midi);
        });

        // Touch
        const touchMap = new Map();

        piano.addEventListener('touchstart', e => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                const el = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-midi]');
                if (!el) continue;
                const midi = +el.dataset.midi;
                touchMap.set(t.identifier, midi);
                pressKey(midi);
            }
        }, { passive: false });

        piano.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                const el      = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-midi]');
                const newMidi = el ? +el.dataset.midi : null;
                const oldMidi = touchMap.get(t.identifier);
                if (newMidi === oldMidi) continue;
                if (oldMidi !== undefined) releaseKey(oldMidi);
                if (newMidi) { touchMap.set(t.identifier, newMidi); pressKey(newMidi); }
                else touchMap.delete(t.identifier);
            }
        }, { passive: false });

        piano.addEventListener('touchend', e => {
            e.preventDefault();
            for (const t of e.changedTouches) {
                const midi = touchMap.get(t.identifier);
                if (midi !== undefined) { releaseKey(midi); touchMap.delete(t.identifier); }
            }
        }, { passive: false });
    }

    return {
        render,
        onNoteOnHandler:  cb => { onNoteOn  = cb; },
        onNoteOffHandler: cb => { onNoteOff = cb; },
    };
})();
