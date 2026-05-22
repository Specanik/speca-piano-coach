const ChordsDB = (() => {
    // MIDI note to note name mapping
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    
    // Comprehensive chord database
    const CHORDS_DATA = {
        'C': {
            name: 'C Major',
            root: 0,
            aliases: ['Cmaj'],
            variations: {
                basic: [
                    { name: 'C Major (Root Position)', notes: [0, 4, 7], midi: [60, 64, 67], difficulty: 'Cơ bản' },
                    { name: 'C Major (1st Inversion)', notes: [4, 7, 12], midi: [64, 67, 72], difficulty: 'Cơ bản' },
                    { name: 'C Major (2nd Inversion)', notes: [7, 12, 16], midi: [67, 72, 76], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Cmaj7', notes: [0, 4, 7, 11], midi: [60, 64, 67, 71], difficulty: 'Trung cấp' },
                    { name: 'Cmaj9', notes: [0, 4, 7, 11, 14], midi: [60, 64, 67, 71, 74], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Cmaj7#11', notes: [0, 4, 7, 11, 18], midi: [60, 64, 67, 71, 78], difficulty: 'Nâng cao' },
                    { name: 'Cmaj13', notes: [0, 4, 7, 11, 14, 21], midi: [60, 64, 67, 71, 74, 81], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm trưởng cơ bản với âm thanh sáng sủa và vui vẻ. Được tạo từ các nốt: C, E, G',
            voicings: [
                'Sử dụng 3 tay ngón: C-E-G',
                'Voicing mở rộng trên 2 tay',
                'Voicing đóng với các ngón tay xếp chồng'
            ]
        },
        'Cm': {
            name: 'C Minor',
            root: 0,
            aliases: ['Cmin'],
            variations: {
                basic: [
                    { name: 'C Minor (Root Position)', notes: [0, 3, 7], midi: [60, 63, 67], difficulty: 'Cơ bản' },
                    { name: 'C Minor (1st Inversion)', notes: [3, 7, 12], midi: [63, 67, 72], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Cm7', notes: [0, 3, 7, 10], midi: [60, 63, 67, 70], difficulty: 'Trung cấp' },
                    { name: 'Cm9', notes: [0, 3, 7, 10, 14], midi: [60, 63, 67, 70, 74], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Cm11', notes: [0, 3, 7, 10, 14, 17], midi: [60, 63, 67, 70, 74, 77], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm thứ với âm thanh u sầu, tăm tối. Được tạo từ các nốt: C, D#, G',
            voicings: [
                'Voicing cơ bản 3 nốt',
                'Voicing với phím 7 ở dưới cùng',
                'Voicing mở rộng 5 nốt'
            ]
        },
        'C7': {
            name: 'C Dominant 7',
            root: 0,
            aliases: ['Cdom7'],
            variations: {
                basic: [
                    { name: 'C7 (Root Position)', notes: [0, 4, 7, 10], midi: [60, 64, 67, 70], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'C7b9', notes: [0, 4, 7, 10, 13], midi: [60, 64, 67, 70, 73], difficulty: 'Trung cấp' },
                    { name: 'C7#9', notes: [0, 4, 7, 10, 15], midi: [60, 64, 67, 70, 75], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'C7#11', notes: [0, 4, 7, 10, 18], midi: [60, 64, 67, 70, 78], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm thứ 7 với nhấn mạnh sáu. Được tạo từ: C, E, G, Bb',
            voicings: [
                'Voicing cơ bản 4 nốt',
                'Voicing với 9 (nhọn hay phẳng)',
                'Voicing jazz phức tạp'
            ]
        },
        'Csus': {
            name: 'C Suspended',
            root: 0,
            aliases: ['Csus4'],
            variations: {
                basic: [
                    { name: 'Csus4', notes: [0, 5, 7], midi: [60, 65, 67], difficulty: 'Cơ bản' },
                    { name: 'Csus2', notes: [0, 2, 7], midi: [60, 62, 67], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Csus4add7', notes: [0, 5, 7, 10], midi: [60, 65, 67, 70], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Csus2add9', notes: [0, 2, 7, 14], midi: [60, 62, 67, 74], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm treo với sự căng thẳng độc đáo. Thường chuyển tiếp đến C Major hoặc C Minor',
            voicings: [
                'Thay thế thứ 3 bằng thứ 4',
                'Thay thế thứ 3 bằng thứ 2',
                'Kết hợp sus4 và sus2'
            ]
        },
        'G': {
            name: 'G Major',
            root: 7,
            aliases: ['Gmaj'],
            variations: {
                basic: [
                    { name: 'G Major (Root Position)', notes: [7, 11, 2], midi: [67, 71, 74], difficulty: 'Cơ bản' },
                    { name: 'G Major (1st Inversion)', notes: [11, 2, 7], midi: [71, 74, 79], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Gmaj7', notes: [7, 11, 2, 6], midi: [67, 71, 74, 78], difficulty: 'Trung cấp' },
                    { name: 'Gmaj9', notes: [7, 11, 2, 6, 9], midi: [67, 71, 74, 78, 81], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Gmaj7#11', notes: [7, 11, 2, 6, 13], midi: [67, 71, 74, 78, 85], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm trưởng G với âm thanh tươi sáng. Được tạo từ: G, B, D',
            voicings: [
                'Voicing mở rộng với G ở dưới',
                'Voicing compact D-G-B',
                'Voicing mở rộng jazz'
            ]
        },
        'D': {
            name: 'D Major',
            root: 2,
            aliases: ['Dmaj'],
            variations: {
                basic: [
                    { name: 'D Major (Root Position)', notes: [2, 6, 9], midi: [62, 66, 69], difficulty: 'Cơ bản' },
                    { name: 'D Major (1st Inversion)', notes: [6, 9, 14], midi: [66, 69, 74], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Dmaj7', notes: [2, 6, 9, 13], midi: [62, 66, 69, 73], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Dmaj7#11', notes: [2, 6, 9, 13, 18], midi: [62, 66, 69, 73, 78], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm trưởng D với âm thanh rõ ràng. Được tạo từ: D, F#, A',
            voicings: [
                'Voicing cơ bản D-F#-A',
                'Voicing mở rộng trên octave',
                'Voicing jazz phức tạp'
            ]
        },
        'Am': {
            name: 'A Minor',
            root: 9,
            aliases: ['Amin'],
            variations: {
                basic: [
                    { name: 'A Minor (Root Position)', notes: [9, 0, 4], midi: [69, 60, 64], difficulty: 'Cơ bản' },
                    { name: 'A Minor (1st Inversion)', notes: [0, 4, 9], midi: [60, 64, 69], difficulty: 'Cơ bản' },
                ],
                intermediate: [
                    { name: 'Am7', notes: [9, 0, 4, 7], midi: [69, 60, 64, 67], difficulty: 'Trung cấp' },
                    { name: 'Am9', notes: [9, 0, 4, 7, 2], midi: [69, 60, 64, 67, 74], difficulty: 'Trung cấp' },
                ],
                advanced: [
                    { name: 'Am11', notes: [9, 0, 4, 7, 2, 5], midi: [69, 60, 64, 67, 74, 77], difficulty: 'Nâng cao' },
                ]
            },
            description: 'Hợp âm thứ A với âm thanh buồn bã, u sầu. Được tạo từ: A, C, E',
            voicings: [
                'Voicing cơ bản 3 nốt',
                'Voicing Am7 phổ biến',
                'Voicing jazz mở rộng'
            ]
        }
    };

    function searchChords(query) {
        const q = query.toLowerCase().trim();
        if (!q) return Object.values(CHORDS_DATA);
        
        return Object.values(CHORDS_DATA).filter(chord => {
            return chord.name.toLowerCase().includes(q) ||
                   chord.aliases.some(alias => alias.toLowerCase().includes(q));
        });
    }

    function getChord(chordName) {
        return CHORDS_DATA[chordName] || null;
    }

    function getAllChords() {
        return Object.entries(CHORDS_DATA).map(([key, chord]) => ({ key, ...chord }));
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
        getAllChords,
        getMidiNotes,
        CHORDS_DATA,
        NOTE_NAMES
    };
})();
