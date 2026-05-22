const ChordsDB = (() => {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const ROOT_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const BASE_OCTAVE = 4;

    const CHORD_TYPES = [
        { suffix: '', type: 'major', label: 'Trưởng', name: 'Major', intervals: [0, 4, 7],
          extInt: { intermediate: [[0, 4, 7, 11]], advanced: [[0, 4, 7, 11, 14]] } },
        { suffix: 'm', type: 'minor', label: 'Thứ', name: 'Minor', intervals: [0, 3, 7],
          extInt: { intermediate: [[0, 3, 7, 10]], advanced: [[0, 3, 7, 10, 14]] } },
        { suffix: '7', type: 'dom7', label: '7', name: 'Dominant 7', intervals: [0, 4, 7, 10],
          extInt: { intermediate: [[0, 4, 7, 10, 14]], advanced: [[0, 4, 7, 10, 13, 14]] } },
        { suffix: 'maj7', type: 'maj7', label: 'Maj7', name: 'Major 7', intervals: [0, 4, 7, 11],
          extInt: { intermediate: [[0, 4, 7, 11, 14]], advanced: [[0, 4, 7, 11, 14, 17]] } },
        { suffix: 'm7', type: 'm7', label: 'm7', name: 'Minor 7', intervals: [0, 3, 7, 10],
          extInt: { intermediate: [[0, 3, 7, 10, 14]], advanced: [[0, 3, 7, 10, 14, 17]] } },
        { suffix: '6', type: 'six', label: '6', name: 'Major 6', intervals: [0, 4, 7, 9],
          extInt: { intermediate: [[0, 4, 7, 9, 14]], advanced: [[0, 4, 7, 9, 11, 14]] } },
        { suffix: 'm6', type: 'm6', label: 'm6', name: 'Minor 6', intervals: [0, 3, 7, 9],
          extInt: { intermediate: [[0, 3, 7, 9, 14]], advanced: [[0, 3, 7, 9, 10, 14]] } },
        { suffix: '9', type: 'dom9', label: '9', name: 'Dominant 9', intervals: [0, 4, 7, 10, 14],
          extInt: { intermediate: [[0, 4, 7, 10, 14, 17]], advanced: [[0, 4, 7, 10, 13, 14]] } },
        { suffix: 'maj9', type: 'maj9', label: 'Maj9', name: 'Major 9', intervals: [0, 4, 7, 11, 14],
          extInt: { intermediate: [[0, 4, 7, 11, 14, 17]], advanced: [[0, 4, 7, 11, 14, 17, 21]] } },
        { suffix: 'add9', type: 'add9', label: 'Add9', name: 'Add 9', intervals: [0, 4, 7, 14],
          extInt: { intermediate: [[0, 4, 7, 11, 14]], advanced: [[0, 4, 7, 14, 17]] } },
        { suffix: 'sus4', type: 'sus4', label: 'Sus4', name: 'Suspended 4', intervals: [0, 5, 7],
          extInt: { intermediate: [[0, 5, 7, 10]], advanced: [[0, 5, 7, 10, 14]] } },
        { suffix: 'sus2', type: 'sus2', label: 'Sus2', name: 'Suspended 2', intervals: [0, 2, 7],
          extInt: { intermediate: [[0, 2, 7, 10]], advanced: [[0, 2, 7, 14]] } },
        { suffix: 'dim', type: 'dim', label: 'Dim', name: 'Diminished', intervals: [0, 3, 6],
          extInt: { intermediate: [[0, 3, 6, 9]], advanced: [[0, 3, 6, 9, 12]] } },
        { suffix: 'aug', type: 'aug', label: 'Aug', name: 'Augmented', intervals: [0, 4, 8],
          extInt: { intermediate: [[0, 4, 8, 11]], advanced: [[0, 4, 8, 11, 14]] } },
        { suffix: 'm7b5', type: 'm7b5', label: 'm7♭5', name: 'Half-Diminished', intervals: [0, 3, 6, 10],
          extInt: { intermediate: [[0, 3, 6, 10, 14]], advanced: [[0, 3, 6, 10, 13, 14]] } }
    ];

    const TYPE_SORT = Object.fromEntries(CHORD_TYPES.map((t, i) => [t.type, i]));
    const TYPE_LABELS = Object.fromEntries(CHORD_TYPES.map(t => [t.type, t.label]));

    const SUFFIX_RULES = [...CHORD_TYPES]
        .sort((a, b) => b.suffix.length - a.suffix.length)
        .map(t => ({ suffix: t.suffix, type: t.type, label: t.label }));

    function rootToPc(rootName) {
        return ROOT_ORDER.indexOf(rootName);
    }

    function intervalsToMidi(rootPc, intervals) {
        const base = 12 * (BASE_OCTAVE + 1) + rootPc;
        return intervals.map(i => base + i);
    }

    function intervalsToNames(rootPc, intervals) {
        return intervals.map(i => NOTE_NAMES[(rootPc + i) % 12]);
    }

    function makeVariation(key, intervals, rootPc, tier, index) {
        const tierLabel = tier === 'basic' ? 'Cơ bản' : tier === 'intermediate' ? 'Trung cấp' : 'Nâng cao';
        const suffix = index > 0 ? ` v${index + 1}` : '';
        return {
            name: `${key}${suffix}`,
            notes: intervals,
            midi: intervalsToMidi(rootPc, intervals),
            difficulty: tierLabel
        };
    }

    function buildVoicingHint(rootName, intervals) {
        const names = intervalsToNames(rootToPc(rootName), intervals);
        return `Các nốt: ${names.join(' – ')}`;
    }

    function buildChordEntry(rootName, typeDef) {
        const root = rootToPc(rootName);
        const key = rootName + typeDef.suffix;
        const aliases = [key];
        if (typeDef.suffix === 'm') aliases.push(rootName + 'min');
        if (typeDef.suffix === '') aliases.push(rootName + 'maj');
        if (typeDef.suffix === '7') aliases.push(rootName + 'dom7');

        const basic = [makeVariation(key, typeDef.intervals, root, 'basic', 0)];
        const intermediate = (typeDef.extInt?.intermediate || []).map((ints, i) =>
            makeVariation(key, ints, root, 'intermediate', i)
        );
        const advanced = (typeDef.extInt?.advanced || []).map((ints, i) =>
            makeVariation(key, ints, root, 'advanced', i)
        );

        const noteStr = intervalsToNames(root, typeDef.intervals).join(', ');

        return {
            name: `${rootName} ${typeDef.name}`,
            root,
            aliases,
            variations: { basic, intermediate, advanced },
            description: `Hợp âm ${typeDef.label} (${rootName}). Nốt trong bậc: ${noteStr}.`,
            voicings: [
                buildVoicingHint(rootName, typeDef.intervals),
                'Bậc gốc — phù hợp nhạc pop/rock',
                intermediate.length ? 'Biến thể trung cấp có thêm nốt mở rộng' : 'Thử đảo bậc (inversion) khi đã quen'
            ]
        };
    }

    const CHORDS_DATA = {};
    ROOT_ORDER.forEach(rootName => {
        CHORD_TYPES.forEach(typeDef => {
            const key = rootName + typeDef.suffix;
            CHORDS_DATA[key] = buildChordEntry(rootName, typeDef);
        });
    });

    function searchChords(query) {
        const q = query.toLowerCase().trim();
        const all = Object.entries(CHORDS_DATA).map(([key, chord]) => ({ key, ...chord }));
        if (!q) return all;

        return all.filter(chord =>
            chord.key.toLowerCase().includes(q) ||
            chord.name.toLowerCase().includes(q) ||
            chord.aliases.some(alias => alias.toLowerCase().includes(q))
        );
    }

    function getChord(chordName) {
        return CHORDS_DATA[chordName] || null;
    }

    function resolveChordKey(raw) {
        const name = raw.trim();
        if (!name) return null;
        if (CHORDS_DATA[name]) return name;

        const lower = name.toLowerCase();
        for (const [key, chord] of Object.entries(CHORDS_DATA)) {
            if (key.toLowerCase() === lower) return key;
            if (chord.aliases.some(a => a.toLowerCase() === lower)) return key;
        }
        return null;
    }

    function getAllChords() {
        return Object.entries(CHORDS_DATA).map(([key, chord]) => ({ key, ...chord }));
    }

    function parseChordKey(key) {
        for (const rule of SUFFIX_RULES) {
            if (rule.suffix === '') {
                if (ROOT_ORDER.includes(key)) {
                    return { root: key, type: 'major' };
                }
                continue;
            }
            if (key.endsWith(rule.suffix)) {
                const root = key.slice(0, -rule.suffix.length);
                if (ROOT_ORDER.includes(root)) {
                    return { root, type: rule.type };
                }
            }
        }
        return { root: key, type: 'other' };
    }

    function getChordTree() {
        const byRoot = new Map();

        Object.entries(CHORDS_DATA).forEach(([key, chord]) => {
            const { root, type } = parseChordKey(key);
            if (!byRoot.has(root)) byRoot.set(root, []);
            byRoot.get(root).push({
                key,
                label: key,
                type,
                typeLabel: TYPE_LABELS[type] || type,
                name: chord.name
            });
        });

        const sortChords = list => list.sort((a, b) => {
            const oa = TYPE_SORT[a.type] ?? 99;
            const ob = TYPE_SORT[b.type] ?? 99;
            return oa - ob || a.label.localeCompare(b.label);
        });

        return ROOT_ORDER
            .filter(root => byRoot.has(root))
            .map(root => ({
                id: root,
                label: root,
                chords: sortChords(byRoot.get(root))
            }));
    }

    function getMidiNotes(chordName, variationType = 'basic', variationIndex = 0) {
        const chord = CHORDS_DATA[chordName];
        if (!chord) return [];
        const variation = chord.variations[variationType]?.[variationIndex];
        return variation ? variation.midi : [];
    }

    return {
        searchChords,
        getChord,
        resolveChordKey,
        getAllChords,
        getChordTree,
        getMidiNotes,
        CHORDS_DATA,
        NOTE_NAMES,
        ROOT_ORDER,
        CHORD_TYPES
    };
})();
