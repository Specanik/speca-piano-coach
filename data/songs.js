/**
 * SongsData — 15 bài nhạc phổ biến dành cho luyện tập tự do.
 *
 * Mỗi bài có:
 *   id, title, artist, difficulty ('beginner'|'intermediate'|'advanced')
 *   bpm, timeSignature ('4/4'|'3/4'|'6/8')
 *   melody: sequence of { midi, durationBeats, label }
 *   thumbnail (emoji)
 *   tags: string[]
 *
 * MIDI durations: 1 beat = 1 quarter note
 */
const SongsData = (() => {

    const SONGS = [
        // ── Beginner ──────────────────────────────────────────────
        {
            id: 'twinkle',
            title: 'Twinkle Twinkle Little Star',
            artist: 'Traditional',
            difficulty: 'beginner',
            bpm: 100,
            timeSignature: '4/4',
            thumbnail: '⭐',
            tags: ['truyền thống', 'thiếu nhi', 'C major'],
            melody: [
                // "Twin-kle twin-kle little star"
                { midi: 60, dur: 1, label: 'C' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 69, dur: 1, label: 'A' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 67, dur: 2, label: 'G' },
                // "How I wonder what you are"
                { midi: 65, dur: 1, label: 'F' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 2, label: 'C' },
                // "Up above the world so high"
                { midi: 67, dur: 1, label: 'G' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 2, label: 'D' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 2, label: 'D' },
                // Repeat first phrase
                { midi: 60, dur: 1, label: 'C' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 69, dur: 1, label: 'A' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 67, dur: 2, label: 'G' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 3, label: 'C' },
            ]
        },

        {
            id: 'ode-to-joy',
            title: 'Ode to Joy (Hymn)',
            artist: 'Beethoven',
            difficulty: 'beginner',
            bpm: 100,
            timeSignature: '4/4',
            thumbnail: '🎻',
            tags: ['cổ điển', 'beethoven', 'C major'],
            melody: [
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 1, label: 'C' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 64, dur: 1.5, label: 'E' }, { midi: 62, dur: 0.5, label: 'D' },
                { midi: 62, dur: 2, label: 'D' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 1, label: 'C' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 1.5, label: 'D' }, { midi: 60, dur: 0.5, label: 'C' },
                { midi: 60, dur: 2, label: 'C' },
            ]
        },

        {
            id: 'happy-birthday',
            title: 'Happy Birthday To You',
            artist: 'Traditional',
            difficulty: 'beginner',
            bpm: 110,
            timeSignature: '3/4',
            thumbnail: '🎂',
            tags: ['truyền thống', '3/4', 'nhẹ nhàng'],
            melody: [
                { midi: 60, dur: 0.5, label: 'C' }, { midi: 60, dur: 0.5, label: 'C' },
                { midi: 62, dur: 1,   label: 'D' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 65, dur: 1,   label: 'F' }, { midi: 64, dur: 2, label: 'E' },
                { midi: 60, dur: 0.5, label: 'C' }, { midi: 60, dur: 0.5, label: 'C' },
                { midi: 62, dur: 1,   label: 'D' }, { midi: 60, dur: 1, label: 'C' },
                { midi: 67, dur: 1,   label: 'G' }, { midi: 65, dur: 2, label: 'F' },
                { midi: 60, dur: 0.5, label: 'C' }, { midi: 60, dur: 0.5, label: 'C' },
                { midi: 72, dur: 1,   label: 'C5'}, { midi: 69, dur: 1, label: 'A' },
                { midi: 65, dur: 1,   label: 'F' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 2,   label: 'D' },
                { midi: 70, dur: 0.5, label: 'Bb'}, { midi: 70, dur: 0.5, label: 'Bb'},
                { midi: 69, dur: 1,   label: 'A' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 67, dur: 1,   label: 'G' }, { midi: 65, dur: 2, label: 'F' },
            ]
        },

        {
            id: 'mary-had-lamb',
            title: 'Mary Had a Little Lamb',
            artist: 'Traditional',
            difficulty: 'beginner',
            bpm: 100,
            timeSignature: '4/4',
            thumbnail: '🐑',
            tags: ['truyền thống', 'thiếu nhi', 'E minor'],
            melody: [
                { midi: 64, dur: 1, label: 'E' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 1, label: 'C' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 64, dur: 2, label: 'E' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 62, dur: 2, label: 'D' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 67, dur: 2, label: 'G' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 1, label: 'C' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 62, dur: 1, label: 'D' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 62, dur: 1, label: 'D' },
                { midi: 60, dur: 2, label: 'C' },
            ]
        },

        // ── Intermediate ───────────────────────────────────────────
        {
            id: 'river-flows',
            title: 'River Flows in You (Simple)',
            artist: 'Yiruma (simplified)',
            difficulty: 'intermediate',
            bpm: 72,
            timeSignature: '4/4',
            thumbnail: '🌊',
            tags: ['ballad', 'yiruma', 'A minor', 'nhẹ nhàng'],
            melody: [
                { midi: 69, dur: 1, label: 'A' }, { midi: 71, dur: 1, label: 'B' },
                { midi: 72, dur: 1, label: 'C5'}, { midi: 74, dur: 1, label: 'D5'},
                { midi: 72, dur: 1, label: 'C5'}, { midi: 71, dur: 1, label: 'B' },
                { midi: 69, dur: 2, label: 'A' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 71, dur: 1, label: 'B' }, { midi: 72, dur: 1, label: 'C5'},
                { midi: 71, dur: 1, label: 'B' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 67, dur: 2, label: 'G' },
                { midi: 65, dur: 1, label: 'F' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 69, dur: 1, label: 'A' }, { midi: 71, dur: 1, label: 'B' },
                { midi: 69, dur: 1, label: 'A' }, { midi: 67, dur: 1, label: 'G' },
                { midi: 65, dur: 2, label: 'F' },
                { midi: 64, dur: 1, label: 'E' }, { midi: 65, dur: 1, label: 'F' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 67, dur: 1, label: 'G' }, { midi: 64, dur: 1, label: 'E' },
                { midi: 60, dur: 3, label: 'C' },
            ]
        },

        {
            id: 'cannon-in-d',
            title: 'Canon in D (Theme)',
            artist: 'Pachelbel (simplified)',
            difficulty: 'intermediate',
            bpm: 80,
            timeSignature: '4/4',
            thumbnail: '🎻',
            tags: ['cổ điển', 'pachelbel', 'D major', 'arpeggio'],
            melody: [
                { midi: 74, dur: 1, label: 'D5'}, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 71, dur: 1, label: 'B' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 71, dur: 1, label: 'B' }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 74, dur: 1, label: 'D5'}, { midi: 66, dur: 1, label: 'F#'},
                { midi: 74, dur: 1, label: 'D5'}, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 71, dur: 1, label: 'B' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 71, dur: 1, label: 'B' }, { midi: 69, dur: 1, label: 'A' },
                { midi: 67, dur: 2, label: 'G' },
            ]
        },

        {
            id: 'let-it-be',
            title: 'Let It Be (Intro)',
            artist: 'The Beatles (simplified)',
            difficulty: 'intermediate',
            bpm: 76,
            timeSignature: '4/4',
            thumbnail: '🕊️',
            tags: ['pop', 'beatles', 'C major', 'vòng C-G-Am-F'],
            melody: [
                { midi: 60, dur: 1, label: 'C'  }, { midi: 67, dur: 0.5, label: 'G'  },
                { midi: 69, dur: 0.5, label: 'A' }, { midi: 67, dur: 1, label: 'G'  },
                { midi: 65, dur: 1, label: 'F'   }, { midi: 60, dur: 1, label: 'C'  },
                { midi: 64, dur: 2, label: 'E'   },
                { midi: 62, dur: 1, label: 'D'   }, { midi: 65, dur: 1, label: 'F'  },
                { midi: 64, dur: 1, label: 'E'   }, { midi: 62, dur: 1, label: 'D'  },
                { midi: 60, dur: 3, label: 'C'   },
            ]
        },

        {
            id: 'a-thousand-years',
            title: 'A Thousand Years (Verse)',
            artist: 'Christina Perri (simplified)',
            difficulty: 'intermediate',
            bpm: 96,
            timeSignature: '4/4',
            thumbnail: '💕',
            tags: ['pop', 'ballad', 'B major', 'romantic'],
            melody: [
                { midi: 71, dur: 1, label: 'B'  }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 74, dur: 2, label: 'D5' },
                { midi: 73, dur: 1, label: 'C#5'}, { midi: 71, dur: 1, label: 'B'  },
                { midi: 69, dur: 2, label: 'A'  },
                { midi: 71, dur: 1, label: 'B'  }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 74, dur: 1, label: 'D5' }, { midi: 76, dur: 1, label: 'E5' },
                { midi: 74, dur: 1, label: 'D5' }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 71, dur: 2, label: 'B'  },
            ]
        },

        {
            id: 'in-the-end',
            title: 'In the End (Riff)',
            artist: 'Linkin Park (simplified)',
            difficulty: 'intermediate',
            bpm: 106,
            timeSignature: '4/4',
            thumbnail: '🎸',
            tags: ['rock', 'linkin park', 'A minor'],
            melody: [
                { midi: 69, dur: 0.5, label: 'A' }, { midi: 71, dur: 0.5, label: 'B' },
                { midi: 72, dur: 1,   label: 'C5'}, { midi: 69, dur: 0.5, label: 'A' },
                { midi: 67, dur: 0.5, label: 'G' }, { midi: 65, dur: 1,   label: 'F' },
                { midi: 64, dur: 1,   label: 'E' }, { midi: 65, dur: 1,   label: 'F' },
                { midi: 67, dur: 1,   label: 'G' }, { midi: 69, dur: 2,   label: 'A' },
                { midi: 67, dur: 1,   label: 'G' }, { midi: 65, dur: 1,   label: 'F' },
                { midi: 64, dur: 3,   label: 'E' },
            ]
        },

        {
            id: 'someone-like-you',
            title: 'Someone Like You (Intro)',
            artist: 'Adele (simplified)',
            difficulty: 'intermediate',
            bpm: 68,
            timeSignature: '4/4',
            thumbnail: '💔',
            tags: ['pop', 'adele', 'A major', 'ballad', 'arpeggio'],
            melody: [
                { midi: 69, dur: 1, label: 'A'  }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 76, dur: 1, label: 'E5' }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 71, dur: 1, label: 'B'  }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 76, dur: 1, label: 'E5' }, { midi: 73, dur: 1, label: 'C#5'},
                { midi: 66, dur: 1, label: 'F#' }, { midi: 69, dur: 1, label: 'A'  },
                { midi: 73, dur: 1, label: 'C#5'}, { midi: 69, dur: 1, label: 'A'  },
                { midi: 66, dur: 2, label: 'F#' },
            ]
        },

        // ── Nhạc Việt ──────────────────────────────────────────────
        {
            id: 'bac-kim-thang',
            title: 'Bắc Kim Thang',
            artist: 'Dân ca Nam Bộ',
            difficulty: 'beginner',
            bpm: 110,
            timeSignature: '2/4',
            thumbnail: '🇻🇳',
            tags: ['dân ca', 'việt nam', 'F major', 'thiếu nhi'],
            melody: [
                { midi: 65, dur: 1, label: 'F'  }, { midi: 65, dur: 1, label: 'F'  },
                { midi: 67, dur: 1, label: 'G'  }, { midi: 69, dur: 1, label: 'A'  },
                { midi: 67, dur: 1, label: 'G'  }, { midi: 65, dur: 1, label: 'F'  },
                { midi: 64, dur: 2, label: 'E'  },
                { midi: 62, dur: 1, label: 'D'  }, { midi: 64, dur: 1, label: 'E'  },
                { midi: 65, dur: 1, label: 'F'  }, { midi: 65, dur: 1, label: 'F'  },
                { midi: 65, dur: 2, label: 'F'  },
            ]
        },

        {
            id: 'ru-con-nam-bo',
            title: 'Ru Con Nam Bộ',
            artist: 'Dân ca Nam Bộ',
            difficulty: 'intermediate',
            bpm: 72,
            timeSignature: '3/4',
            thumbnail: '🌙',
            tags: ['dân ca', 'việt nam', 'ru', '3/4'],
            melody: [
                { midi: 60, dur: 1.5, label: 'C'  }, { midi: 62, dur: 0.5, label: 'D' },
                { midi: 64, dur: 1,   label: 'E'  }, { midi: 65, dur: 1,   label: 'F' },
                { midi: 64, dur: 3,   label: 'E'  },
                { midi: 62, dur: 1.5, label: 'D'  }, { midi: 60, dur: 0.5, label: 'C' },
                { midi: 62, dur: 1,   label: 'D'  }, { midi: 64, dur: 1,   label: 'E' },
                { midi: 60, dur: 3,   label: 'C'  },
                { midi: 65, dur: 1,   label: 'F'  }, { midi: 64, dur: 1,   label: 'E' },
                { midi: 62, dur: 1,   label: 'D'  },
                { midi: 60, dur: 3,   label: 'C'  },
            ]
        },

        {
            id: 'tien-quan-ca',
            title: 'Tiến Quân Ca (Đoạn đầu)',
            artist: 'Văn Cao',
            difficulty: 'intermediate',
            bpm: 100,
            timeSignature: '4/4',
            thumbnail: '🎖️',
            tags: ['việt nam', 'quốc ca', 'D minor'],
            melody: [
                { midi: 62, dur: 1, label: 'D'  }, { midi: 62, dur: 1, label: 'D'  },
                { midi: 65, dur: 1, label: 'F'  }, { midi: 65, dur: 1, label: 'F'  },
                { midi: 69, dur: 2, label: 'A'  },
                { midi: 69, dur: 1, label: 'A'  }, { midi: 67, dur: 1, label: 'G'  },
                { midi: 65, dur: 1, label: 'F'  }, { midi: 67, dur: 1, label: 'G'  },
                { midi: 69, dur: 2, label: 'A'  },
                { midi: 74, dur: 1, label: 'D5' }, { midi: 74, dur: 1, label: 'D5' },
                { midi: 72, dur: 1, label: 'C5' }, { midi: 72, dur: 1, label: 'C5' },
                { midi: 70, dur: 2, label: 'Bb' },
            ]
        },

        // ── Advanced ───────────────────────────────────────────────
        {
            id: 'moonlight-sonata',
            title: 'Moonlight Sonata (Op. 27 No. 2)',
            artist: 'Beethoven (simplified)',
            difficulty: 'advanced',
            bpm: 60,
            timeSignature: '4/4',
            thumbnail: '🌕',
            tags: ['cổ điển', 'beethoven', 'C# minor', 'arpeggio'],
            melody: [
                { midi: 61, dur: 0.67, label: 'C#5'}, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 69, dur: 0.67, label: 'A5' },
                { midi: 61, dur: 0.67, label: 'C#5'}, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 69, dur: 0.67, label: 'A5' },
                { midi: 60, dur: 0.67, label: 'C5' }, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 69, dur: 0.67, label: 'A5' },
                { midi: 60, dur: 0.67, label: 'C5' }, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 69, dur: 0.67, label: 'A5' },
                { midi: 59, dur: 0.67, label: 'B4' }, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 68, dur: 0.67, label: 'Ab5'},
                { midi: 59, dur: 0.67, label: 'B4' }, { midi: 64, dur: 0.67, label: 'E5' },
                { midi: 68, dur: 0.67, label: 'Ab5'},
            ]
        },

        {
            id: 'fur-elise',
            title: 'Für Elise (Main Theme)',
            artist: 'Beethoven',
            difficulty: 'advanced',
            bpm: 116,
            timeSignature: '3/8',
            thumbnail: '🌹',
            tags: ['cổ điển', 'beethoven', 'A minor', 'iconic'],
            melody: [
                { midi: 76, dur: 0.5, label: 'E5' }, { midi: 75, dur: 0.5, label: 'D#5'},
                { midi: 76, dur: 0.5, label: 'E5' }, { midi: 75, dur: 0.5, label: 'D#5'},
                { midi: 76, dur: 0.5, label: 'E5' }, { midi: 71, dur: 0.5, label: 'B4' },
                { midi: 74, dur: 0.5, label: 'D5' }, { midi: 72, dur: 0.5, label: 'C5' },
                { midi: 69, dur: 1,   label: 'A4' },
                { midi: 60, dur: 0.5, label: 'C4' }, { midi: 64, dur: 0.5, label: 'E4' },
                { midi: 69, dur: 0.5, label: 'A4' }, { midi: 71, dur: 1,   label: 'B4' },
                { midi: 64, dur: 0.5, label: 'E4' }, { midi: 68, dur: 0.5, label: 'Ab4'},
                { midi: 71, dur: 0.5, label: 'B4' }, { midi: 72, dur: 1,   label: 'C5' },
                { midi: 64, dur: 0.5, label: 'E4' }, { midi: 76, dur: 0.5, label: 'E5' },
                { midi: 75, dur: 0.5, label: 'D#5'}, { midi: 76, dur: 0.5, label: 'E5' },
                { midi: 75, dur: 0.5, label: 'D#5'}, { midi: 76, dur: 0.5, label: 'E5' },
                { midi: 71, dur: 0.5, label: 'B4' }, { midi: 74, dur: 0.5, label: 'D5' },
                { midi: 72, dur: 0.5, label: 'C5' }, { midi: 69, dur: 1,   label: 'A4' },
            ]
        }
    ];

    function getAll() { return SONGS; }
    function getById(id) { return SONGS.find(s => s.id === id) || null; }
    function getByDifficulty(d) { return SONGS.filter(s => s.difficulty === d); }

    /**
     * Convert song melody to FallingNotes-compatible sequence.
     * Each beat = (60000 / bpm) ms.
     */
    function toSequence(songId) {
        const song = getById(songId);
        if (!song) return [];
        const msPerBeat = 60000 / song.bpm;
        return song.melody.map(n => ({
            midi:       n.midi,
            label:      n.label,
            durationMs: Math.round(n.dur * msPerBeat)
        }));
    }

    return { getAll, getById, getByDifficulty, toSequence };
})();
