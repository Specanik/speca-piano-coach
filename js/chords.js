const ChordsDB = (() => {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const ROOT_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const BASE_OCTAVE = 4;

    // ── Chord type definitions ────────────────────────────────────────────────
    // formula   : interval names shown to student (e.g. "1 – 3 – 5")
    // sound     : adjectives describing the chord's character
    // usage     : common harmonic function
    // basicVariants : named root-position + inversions for triads
    // extInt    : { intermediate: [...intervals[]], advanced: [...intervals[]] }
    const CHORD_TYPES = [
        {
            suffix: '', type: 'major', label: 'Trưởng', name: 'Major',
            intervals: [0, 4, 7],
            formula: '1 – 3 – 5',
            sound: 'Sáng, vui, tươi',
            usage: 'Hợp âm I trong giọng trưởng; chủ âm mạnh mẽ',
            progressions: 'C – Am – F – G  |  I – V – vi – IV  |  I – IV – V',
            basicVariants: [
                { intervals: [0, 4, 7],   label: 'Bậc gốc (Root)' },
                { intervals: [4, 7, 12],  label: 'Đảo bậc 1' },
                { intervals: [7, 12, 16], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 4, 7, 11]],
                advanced:     [[0, 4, 7, 11, 14]]
            }
        },
        {
            suffix: 'm', type: 'minor', label: 'Thứ', name: 'Minor',
            intervals: [0, 3, 7],
            formula: '1 – ♭3 – 5',
            sound: 'Buồn, u hoài, trầm lắng',
            usage: 'Hợp âm ii, iii, vi trong giọng trưởng; chủ âm giọng thứ',
            progressions: 'Am – F – C – G  |  vi – IV – I – V  |  i – VII – VI – VII',
            basicVariants: [
                { intervals: [0, 3, 7],   label: 'Bậc gốc (Root)' },
                { intervals: [3, 7, 12],  label: 'Đảo bậc 1' },
                { intervals: [7, 12, 15], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 3, 7, 10]],
                advanced:     [[0, 3, 7, 10, 14]]
            }
        },
        {
            suffix: '7', type: 'dom7', label: '7', name: 'Dominant 7',
            intervals: [0, 4, 7, 10],
            formula: '1 – 3 – 5 – ♭7',
            sound: 'Căng thẳng, muốn giải quyết về tonic',
            usage: 'Hợp âm V7 — tạo sức căng dẫn về chủ âm mạnh nhất',
            progressions: 'G7 – C  |  V7 – I  |  V7/IV – IV',
            extInt: {
                intermediate: [[0, 4, 7, 10, 14]],
                advanced:     [[0, 4, 7, 10, 13, 14]]
            }
        },
        {
            suffix: 'maj7', type: 'maj7', label: 'Maj7', name: 'Major 7',
            intervals: [0, 4, 7, 11],
            formula: '1 – 3 – 5 – 7',
            sound: 'Mơ mộng, nhẹ nhàng, tinh tế',
            usage: 'Hợp âm Imaj7 hoặc IVmaj7 trong pop, jazz, R&B',
            progressions: 'Cmaj7 – Am7 – Fmaj7 – G7  |  Imaj7 – vi7 – IVmaj7 – V7',
            extInt: {
                intermediate: [[0, 4, 7, 11, 14]],
                advanced:     [[0, 4, 7, 11, 14, 17]]
            }
        },
        {
            suffix: 'm7', type: 'm7', label: 'm7', name: 'Minor 7',
            intervals: [0, 3, 7, 10],
            formula: '1 – ♭3 – 5 – ♭7',
            sound: 'Mềm mại, u uất nhẹ, soul, jazz',
            usage: 'Hợp âm ii7, iii7, vi7 trong jazz/pop; ii7–V7–I phổ biến nhất',
            progressions: 'Am7 – Dm7 – G7 – Cmaj7  |  ii7 – V7 – Imaj7',
            extInt: {
                intermediate: [[0, 3, 7, 10, 14]],
                advanced:     [[0, 3, 7, 10, 14, 17]]
            }
        },
        {
            suffix: '6', type: 'six', label: '6', name: 'Major 6',
            intervals: [0, 4, 7, 9],
            formula: '1 – 3 – 5 – 6',
            sound: 'Tươi sáng, hoàn chỉnh, dịu dàng',
            usage: 'Thay thế hợp âm I trong ballad, pop nhẹ; nghe nhẹ hơn Maj7',
            progressions: 'C6 – Am – F – G  |  I6 thay vì I',
            extInt: {
                intermediate: [[0, 4, 7, 9, 14]],
                advanced:     [[0, 4, 7, 9, 11, 14]]
            }
        },
        {
            suffix: 'm6', type: 'm6', label: 'm6', name: 'Minor 6',
            intervals: [0, 3, 7, 9],
            formula: '1 – ♭3 – 5 – 6',
            sound: 'Buồn nhưng tinh tế, latin, tango',
            usage: 'Hợp âm vi6 trong bossa nova, tango; thay thế Am',
            progressions: 'Am6 – B7 – Em  |  i6 – V7 – i',
            extInt: {
                intermediate: [[0, 3, 7, 9, 14]],
                advanced:     [[0, 3, 7, 9, 10, 14]]
            }
        },
        {
            suffix: '9', type: 'dom9', label: '9', name: 'Dominant 9',
            intervals: [0, 4, 7, 10, 14],
            formula: '1 – 3 – 5 – ♭7 – 9',
            sound: 'Phong phú, dày dặn, funky, groove',
            usage: 'V9 trong jazz, funk, R&B — đầy đặn hơn V7',
            progressions: 'G9 – C  |  V9 – Imaj7  |  ii9 – V9 – Imaj9',
            extInt: {
                intermediate: [[0, 4, 7, 10, 14, 17]],
                advanced:     [[0, 4, 7, 10, 13, 14]]
            }
        },
        {
            suffix: 'maj9', type: 'maj9', label: 'Maj9', name: 'Major 9',
            intervals: [0, 4, 7, 11, 14],
            formula: '1 – 3 – 5 – 7 – 9',
            sound: 'Lộng lẫy, jazz hiện đại, rộng mở',
            usage: 'Imaj9 hoặc IVmaj9 trong jazz, neo-soul, gospel',
            progressions: 'Cmaj9 – Am9 – Fmaj9 – G9',
            extInt: {
                intermediate: [[0, 4, 7, 11, 14, 17]],
                advanced:     [[0, 4, 7, 11, 14, 17, 21]]
            }
        },
        {
            suffix: 'add9', type: 'add9', label: 'Add9', name: 'Add 9',
            intervals: [0, 4, 7, 14],
            formula: '1 – 3 – 5 – 9 (không có 7th)',
            sound: 'Tươi mới, mở, nhẹ nhàng, indie pop',
            usage: 'Thay thế Major khi muốn âm thanh sáng hơn, không jazz',
            progressions: 'Cadd9 – G – Am – F  |  Iadd9 thay vì I',
            extInt: {
                intermediate: [[0, 4, 7, 11, 14]],
                advanced:     [[0, 4, 7, 14, 17]]
            }
        },
        {
            suffix: 'sus4', type: 'sus4', label: 'Sus4', name: 'Suspended 4',
            intervals: [0, 5, 7],
            formula: '1 – 4 – 5',
            sound: 'Lơ lửng, chờ đợi, trung tính',
            usage: 'Tạo cảm giác chờ trước khi giải quyết về I hoặc V',
            progressions: 'Gsus4 – G  |  Dsus4 – D – G  |  Vsus4 – V – I',
            basicVariants: [
                { intervals: [0, 5, 7],   label: 'Bậc gốc (Root)' },
                { intervals: [5, 7, 12],  label: 'Đảo bậc 1' },
                { intervals: [7, 12, 17], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 5, 7, 10]],
                advanced:     [[0, 5, 7, 10, 14]]
            }
        },
        {
            suffix: 'sus2', type: 'sus2', label: 'Sus2', name: 'Suspended 2',
            intervals: [0, 2, 7],
            formula: '1 – 2 – 5',
            sound: 'Thoáng, bay bổng, ambient, trong sáng',
            usage: 'Thay thế Major/Minor khi muốn âm thanh mở và nhẹ',
            progressions: 'Dsus2 – Asus2 – Esus2  |  Vsus2 – IV – I',
            basicVariants: [
                { intervals: [0, 2, 7],   label: 'Bậc gốc (Root)' },
                { intervals: [2, 7, 12],  label: 'Đảo bậc 1' },
                { intervals: [7, 12, 14], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 2, 7, 10]],
                advanced:     [[0, 2, 7, 14]]
            }
        },
        {
            suffix: 'dim', type: 'dim', label: 'Dim', name: 'Diminished',
            intervals: [0, 3, 6],
            formula: '1 – ♭3 – ♭5',
            sound: 'Căng thẳng, bất ổn, kịch tính',
            usage: 'Passing chord, hợp âm vii° trong giọng trưởng — dẫn về I',
            progressions: 'Bdim – C  |  vii° – I  |  I – #Idim – ii (chromatic)',
            basicVariants: [
                { intervals: [0, 3, 6],   label: 'Bậc gốc (Root)' },
                { intervals: [3, 6, 12],  label: 'Đảo bậc 1' },
                { intervals: [6, 12, 15], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 3, 6, 9]],
                advanced:     [[0, 3, 6, 9, 12]]
            }
        },
        {
            suffix: 'dim7', type: 'dim7', label: 'Dim7', name: 'Diminished 7',
            intervals: [0, 3, 6, 9],
            formula: '1 – ♭3 – ♭5 – ♭♭7 (6)',
            sound: 'Rất căng, đen tối, kịch tính cao',
            usage: 'Passing chord mạnh; thay V7b9; dễ modulate vì đối xứng',
            progressions: 'Bdim7 – C  |  #ivdim7 – V7  |  vii°7 – I',
            extInt: {
                intermediate: [[0, 3, 6, 9, 12]],
                advanced:     [[0, 3, 6, 9, 15]]
            }
        },
        {
            suffix: 'aug', type: 'aug', label: 'Aug', name: 'Augmented',
            intervals: [0, 4, 8],
            formula: '1 – 3 – ♯5',
            sound: 'Huyền bí, bay bổng, không ổn định',
            usage: 'Passing chord giữa I và IV; hoặc thay V dẫn về I',
            progressions: 'C – Caug – F  |  I – I+ – IV  |  I – III+ – vi',
            basicVariants: [
                { intervals: [0, 4, 8],   label: 'Bậc gốc (Root)' },
                { intervals: [4, 8, 12],  label: 'Đảo bậc 1' },
                { intervals: [8, 12, 16], label: 'Đảo bậc 2' }
            ],
            extInt: {
                intermediate: [[0, 4, 8, 11]],
                advanced:     [[0, 4, 8, 11, 14]]
            }
        },
        {
            suffix: 'm7b5', type: 'm7b5', label: 'm7♭5', name: 'Half-Diminished',
            intervals: [0, 3, 6, 10],
            formula: '1 – ♭3 – ♭5 – ♭7',
            sound: 'U ám, jazz, căng thẳng nhẹ, không chắc chắn',
            usage: 'Hợp âm iiø7 trong giọng thứ; ii° trong jazz (ii–V–i)',
            progressions: 'Bm7b5 – E7 – Am  |  iiø7 – V7 – i',
            extInt: {
                intermediate: [[0, 3, 6, 10, 14]],
                advanced:     [[0, 3, 6, 10, 13, 14]]
            }
        },
        {
            suffix: '7sus4', type: '7sus4', label: '7sus4', name: 'Dominant 7 Sus4',
            intervals: [0, 5, 7, 10],
            formula: '1 – 4 – 5 – ♭7',
            sound: 'Lơ lửng, căng nhẹ, groove, hiện đại',
            usage: 'V7sus4 trong pop, funk — dịu hơn V7; giải quyết V7 rồi về I',
            progressions: 'Gsus4 – G7 – C  |  V7sus4 – V7 – I',
            extInt: {
                intermediate: [[0, 5, 7, 10, 14]],
                advanced:     [[0, 5, 7, 10, 14, 17]]
            }
        },
        {
            suffix: 'm9', type: 'm9', label: 'm9', name: 'Minor 9',
            intervals: [0, 3, 7, 10, 14],
            formula: '1 – ♭3 – 5 – ♭7 – 9',
            sound: 'Ấm áp, mơ mộng, neo-soul, R&B',
            usage: 'Im9, vim9 trong R&B, neo-soul, jazz; rất phổ biến nhạc Việt hiện đại',
            progressions: 'Am9 – Fmaj7 – C – G  |  im9 – VImaj7 – III – VII',
            extInt: {
                intermediate: [[0, 3, 7, 10, 14, 17]],
                advanced:     [[0, 3, 10, 14, 17]]
            }
        },
        {
            suffix: '6/9', type: 'maj69', label: '6/9', name: 'Major 6/9',
            intervals: [0, 4, 7, 9, 14],
            formula: '1 – 3 – 5 – 6 – 9',
            sound: 'Rực rỡ, jazz hiện đại, gospel, tươi sáng',
            usage: 'Thay I hoặc IVmaj trong jazz, gospel; âm thanh mở và đẹp',
            progressions: 'C6/9 – F6/9 – G9  |  I6/9 thay Imaj',
            extInt: {
                intermediate: [[0, 4, 9, 14]],
                advanced:     [[0, 4, 7, 9, 14, 17]]
            }
        },
        {
            suffix: '11', type: 'dom11', label: '11', name: 'Dominant 11',
            intervals: [0, 4, 7, 10, 14, 17],
            formula: '1 – 3 – 5 – ♭7 – 9 – 11',
            sound: 'Dày, phức tạp, jazz nâng cao, fusion',
            usage: 'V11 trong jazz, modal harmony; thường bỏ bớt nốt để sạch',
            progressions: 'G11 – Cmaj9  |  V11 – Imaj9',
            extInt: {
                intermediate: [[0, 7, 10, 14, 17]],
                advanced:     [[0, 7, 10, 14, 17, 21]]
            }
        },
        {
            suffix: 'm11', type: 'm11', label: 'm11', name: 'Minor 11',
            intervals: [0, 3, 7, 10, 14, 17],
            formula: '1 – ♭3 – 5 – ♭7 – 9 – 11',
            sound: 'Mênh mang, modal, R&B hiện đại, dreamy',
            usage: 'Im11 trong jazz modal, neo-soul; âm thanh "trôi nổi"',
            progressions: 'Am11 – Fmaj9 – Gsus4  |  im11 – VImaj9',
            extInt: {
                intermediate: [[0, 3, 7, 10, 14, 17]],
                advanced:     [[0, 3, 10, 14, 17, 20]]
            }
        }
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

    function makeVariation(key, intervals, rootPc, tier, index, customLabel = null) {
        const tierLabel = tier === 'basic' ? 'Cơ bản' : tier === 'intermediate' ? 'Trung cấp' : 'Nâng cao';
        const suffix = index > 0 ? ` v${index + 1}` : '';
        const name = customLabel || `${key}${suffix}`;
        return {
            name,
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
        if (typeDef.suffix === 'm')    aliases.push(rootName + 'min');
        if (typeDef.suffix === '')     aliases.push(rootName + 'maj');
        if (typeDef.suffix === '7')    aliases.push(rootName + 'dom7');
        if (typeDef.suffix === 'dim7') aliases.push(rootName + '°7');
        if (typeDef.suffix === 'dim')  aliases.push(rootName + '°');
        if (typeDef.suffix === 'aug')  aliases.push(rootName + '+');
        if (typeDef.suffix === 'm7b5') aliases.push(rootName + 'ø7');

        // Build basic variants: use named inversions if defined, else single root
        const basicSource = typeDef.basicVariants
            || [{ intervals: typeDef.intervals, label: 'Bậc gốc (Root)' }];
        const basic = basicSource.map((v, i) =>
            makeVariation(key, v.intervals, root, 'basic', i, v.label)
        );

        const intermediate = (typeDef.extInt?.intermediate || []).map((ints, i) =>
            makeVariation(key, ints, root, 'intermediate', i)
        );
        const advanced = (typeDef.extInt?.advanced || []).map((ints, i) =>
            makeVariation(key, ints, root, 'advanced', i)
        );

        const noteStr = intervalsToNames(root, typeDef.intervals).join(', ');
        const sound   = typeDef.sound   || '';
        const usage   = typeDef.usage   || '';
        const formula = typeDef.formula || '';

        return {
            name: `${rootName} ${typeDef.name}`,
            root,
            aliases,
            formula,
            sound,
            usage,
            progressions: typeDef.progressions || '',
            variations: { basic, intermediate, advanced },
            description: `Hợp âm ${typeDef.label} (${rootName}). ${sound ? sound + '. ' : ''}Nốt: ${noteStr}.`,
            voicings: [
                buildVoicingHint(rootName, typeDef.intervals),
                formula ? `Công thức: ${formula}` : '',
                usage   ? `Cách dùng: ${usage}` : '',
                typeDef.progressions ? `Ví dụ tiến hành: ${typeDef.progressions.split('|')[0].trim()}` : ''
            ].filter(Boolean)
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
                if (ROOT_ORDER.includes(key)) return { root: key, type: 'major' };
                continue;
            }
            if (key.endsWith(rule.suffix)) {
                const root = key.slice(0, -rule.suffix.length);
                if (ROOT_ORDER.includes(root)) return { root, type: rule.type };
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
