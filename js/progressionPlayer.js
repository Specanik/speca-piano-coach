const ProgressionPlayer = (() => {
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    const PROGRESSIONS = [
        {
            id: 'pop-I-V-vi-IV',
            name: 'I – V – vi – IV',
            label: 'Pop',
            semitones: [0, 7, 9, 5],
            types: ['', '', 'm', ''],
            defaultKey: 'C',
            genre: 'Pop, Ballad',
            mood: 'Vui, quen thuộc',
            description: 'Vòng phổ biến nhất thế giới — nền tảng của hàng nghìn bài pop hit.'
        },
        {
            id: 'ballad-vi-IV-I-V',
            name: 'vi – IV – I – V',
            label: 'Ballad',
            semitones: [9, 5, 0, 7],
            types: ['m', '', '', ''],
            defaultKey: 'C',
            genre: 'Ballad, Pop',
            mood: 'Buồn, da diết',
            description: 'Cùng 4 hợp âm với Pop nhưng bắt đầu từ vi (thứ) — nghe buồn hơn rõ rệt.'
        },
        {
            id: '50s-I-vi-IV-V',
            name: 'I – vi – IV – V',
            label: '50s',
            semitones: [0, 9, 5, 7],
            types: ['', 'm', '', ''],
            defaultKey: 'C',
            genre: 'Doo-Wop, Oldies',
            mood: 'Lãng mạn, hoài cổ',
            description: 'Vòng thập niên 50 — nhẹ nhàng, lãng mạn, dùng nhiều trong nhạc vàng.'
        },
        {
            id: 'jazz-ii7-V7-Imaj7',
            name: 'ii7 – V7 – Imaj7',
            label: 'Jazz ii–V–I',
            semitones: [2, 7, 0],
            types: ['m7', '7', 'maj7'],
            defaultKey: 'C',
            genre: 'Jazz, Bossa Nova',
            mood: 'Tinh tế, đẳng cấp',
            description: 'Vòng cơ bản của jazz — tạo căng (ii7→V7) rồi giải quyết hoàn hảo về Imaj7.'
        },
        {
            id: 'blues-I7-IV7-V7',
            name: 'I7 – IV7 – V7',
            label: 'Blues',
            semitones: [0, 5, 7],
            types: ['7', '7', '7'],
            defaultKey: 'G',
            genre: 'Blues, Rock',
            mood: 'Groove, mạnh mẽ',
            description: 'Nền tảng blues 12 nhịp — dominant 7th xuyên suốt tạo groove đặc trưng.'
        },
        {
            id: 'minor-i-VII-VI-VII',
            name: 'i – VII – VI – VII',
            label: 'Thứ Việt',
            semitones: [0, 10, 8, 10],
            types: ['m', '', '', ''],
            defaultKey: 'A',
            genre: 'Ballad Việt, Pop',
            mood: 'Da diết, sâu lắng',
            description: 'Vòng giọng thứ phổ biến nhất nhạc Việt — nghe da diết, dễ chạm lòng.'
        },
        {
            id: 'minor-i-iv-V7',
            name: 'i – iv – V7',
            label: 'Thứ Cổ điển',
            semitones: [0, 5, 7],
            types: ['m', 'm', '7'],
            defaultKey: 'A',
            genre: 'Cổ điển, Flamenco',
            mood: 'U buồn, kịch tính',
            description: 'Vòng thứ cổ điển — iv (thứ 4) tạo nét buồn đặc trưng, V7 giải quyết mạnh.'
        },
        {
            id: 'andalusian',
            name: 'i – VII – VI – V',
            label: 'Andalusian',
            semitones: [0, 10, 8, 7],
            types: ['m', '', '', ''],
            defaultKey: 'A',
            genre: 'Flamenco, Rock',
            mood: 'Kịch tính, bí ẩn',
            description: 'Vòng Andalusian — hạ dần bậc, âm hưởng Tây Ban Nha, dùng nhiều trong rock.'
        },
        {
            id: 'pachelbel',
            name: 'I–V–vi–iii–IV–I–IV–V',
            label: 'Pachelbel',
            semitones: [0, 7, 9, 4, 5, 0, 5, 7],
            types: ['', '', 'm', 'm', '', '', '', ''],
            defaultKey: 'C',
            genre: 'Cổ điển, Pop',
            mood: 'Trang trọng, hoàn chỉnh',
            description: 'Canon Pachelbel — nền tảng của vô số bài nhạc từ baroque đến pop hiện đại.'
        },
        {
            id: 'circle-vi7-ii7-V7-Imaj7',
            name: 'vi7 – ii7 – V7 – Imaj7',
            label: 'Vòng Quinte',
            semitones: [9, 2, 7, 0],
            types: ['m7', 'm7', '7', 'maj7'],
            defaultKey: 'C',
            genre: 'Jazz, Gospel',
            mood: 'Cuộn tròn, tinh tế',
            description: 'Vòng quinte — mỗi hợp âm tiến lên quãng 4, tạo cảm giác "cuộn" liên tục.'
        }
    ];

    const VOICING_TYPES = [
        {
            id: 'close135', label: '1–3–5',
            desc: 'Hợp âm 3 nốt cơ bản',
            build(base, ext, rootMidi) {
                return base.slice(0, 3).map(i => rootMidi + i);
            }
        },
        {
            id: 'open158', label: '1–5–8',
            desc: 'Rộng: root + quãng 5 + octave',
            build(base, ext, rootMidi) {
                return [rootMidi, rootMidi + (base[2] || 7), rootMidi + 12];
            }
        },
        {
            id: 'full1358', label: '1–3–5–8',
            desc: 'Đầy đủ: triad + octave',
            build(base, ext, rootMidi) {
                return [...base.slice(0, 3).map(i => rootMidi + i), rootMidi + 12];
            }
        },
        {
            id: 'spread1510', label: '1–5–10',
            desc: 'Trải rộng: bass + 5th + 3rd lên octave',
            build(base, ext, rootMidi) {
                return [rootMidi, rootMidi + (base[2] || 7), rootMidi + (base[1] || 4) + 12];
            }
        },
        {
            id: 'color7', label: '7th',
            desc: 'Hợp âm 7th màu sắc',
            build(base, ext, rootMidi) {
                const notes = base.length >= 4 ? base.slice(0, 4) : (ext.length >= 4 ? ext.slice(0, 4) : [...base.slice(0, 3), base[2] + 3]);
                return notes.map(i => rootMidi + i);
            }
        },
        {
            id: 'color9', label: '9th',
            desc: 'Hợp âm 9th — jazz, phong phú',
            build(base, ext, rootMidi) {
                const four = base.length >= 4 ? base.slice(0, 4) : (ext.length >= 4 ? ext.slice(0, 4) : [...base.slice(0, 3), base[2] + 3]);
                const five = ext.length >= 5 ? ext.slice(0, 5) : [...four, 14];
                return five.map(i => rootMidi + i);
            }
        },
        {
            id: 'shell37', label: 'Shell',
            desc: 'Jazz shell: root + 3rd + 7th',
            build(base, ext, rootMidi) {
                const third = base[1] || 4;
                const seventh = base.length >= 4 ? base[3] : (ext.length >= 4 ? ext[3] : third + 7);
                return [rootMidi, rootMidi + third, rootMidi + seventh];
            }
        }
    ];

    let selectedKey = localStorage.getItem('piano-prog-key') || 'C';
    let selectedVoicing = localStorage.getItem('piano-prog-voicing') || 'close135';
    let bpm = parseInt(localStorage.getItem('piano-prog-bpm'), 10) || 76;
    let playingId = null;
    let timers = [];

    function buildVoicingMidi(chordKey) {
        const chord = ChordsDB.getChord(chordKey);
        if (!chord) return [];
        const rootMidi = 12 * 5 + chord.root;
        const base = chord.variations.basic[0]?.notes || [];
        const ext  = chord.variations.intermediate[0]?.notes || base;
        const vtype = VOICING_TYPES.find(v => v.id === selectedVoicing) || VOICING_TYPES[0];
        return vtype.build(base, ext, rootMidi);
    }

    function getChordKey(semitone, type, rootName) {
        const rootPc = NOTE_NAMES.indexOf(rootName);
        const pc = (rootPc + semitone) % 12;
        return NOTE_NAMES[pc] + type;
    }

    function getProgChords(prog, key) {
        return prog.semitones.map((s, i) => getChordKey(s, prog.types[i], key));
    }

    function stopAll() {
        timers.forEach(t => clearTimeout(t));
        timers = [];
        ChordPlayer.stopChord();
        ChordUI.updateKeyboardHighlight([]);

        playingId = null;

        document.querySelectorAll('.prog-chord-pill.prog-chord-active').forEach(el => {
            el.classList.remove('prog-chord-active');
        });
        document.querySelectorAll('.prog-card-interactive.is-playing').forEach(el => {
            el.classList.remove('is-playing');
        });
        document.querySelectorAll('.prog-play-btn.playing').forEach(btn => {
            btn.textContent = '▶';
            btn.classList.remove('playing');
        });
    }

    function scheduleRound(prog, chordKeys) {
        const beatMs = Math.round(60000 / bpm * 2);

        chordKeys.forEach((key, i) => {
            const t = setTimeout(() => {
                if (playingId !== prog.id) return;

                const card = document.querySelector(`[data-prog-id="${prog.id}"]`);
                if (card) {
                    card.querySelectorAll('.prog-chord-pill').forEach((el, j) => {
                        el.classList.toggle('prog-chord-active', j === i);
                    });
                }

                const midi = buildVoicingMidi(key);
                if (midi.length) {
                    ChordPlayer.playWithPattern(midi, 'arpeggioUp', beatMs - 80, true);
                    ChordUI.updateKeyboardHighlight(midi);
                }
            }, i * beatMs);
            timers.push(t);
        });

        return chordKeys.length * beatMs;
    }

    function playProgression(prog, btn) {
        if (playingId === prog.id) {
            stopAll();
            return;
        }
        stopAll();

        playingId = prog.id;
        btn.textContent = '■';
        btn.classList.add('playing');

        const card = document.querySelector(`[data-prog-id="${prog.id}"]`);
        if (card) card.classList.add('is-playing');

        const chordKeys = getProgChords(prog, selectedKey);
        const totalMs = scheduleRound(prog, chordKeys);

        const endT = setTimeout(() => {
            if (playingId !== prog.id) return;
            stopAll();
        }, totalMs + 300);
        timers.push(endT);
    }

    function renderProgressions() {
        const container = document.getElementById('prog-interactive-section');
        if (!container) return;

        container.innerHTML = `
            <div class="prog-controls">
                <div class="prog-key-row">
                    <span class="prog-ctrl-label">Giọng</span>
                    <div class="prog-key-btns">
                        ${NOTE_NAMES.map(n => `
                            <button type="button"
                                class="prog-key-btn${n === selectedKey ? ' active' : ''}"
                                data-key="${n}">${n}</button>
                        `).join('')}
                    </div>
                </div>
                <div class="prog-bpm-row">
                    <span class="prog-ctrl-label">Nhịp</span>
                    <input type="range" class="prog-bpm-slider" min="48" max="116" step="4" value="${bpm}">
                    <span class="prog-bpm-value">${bpm}</span>
                </div>
                <div class="prog-voicing-row">
                    <span class="prog-ctrl-label">Thế bấm</span>
                    <div class="prog-voicing-btns">
                        ${VOICING_TYPES.map(v => `
                            <button type="button"
                                class="prog-voicing-btn${v.id === selectedVoicing ? ' active' : ''}"
                                data-voicing="${v.id}"
                                title="${v.desc}">${v.label}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="prog-list">
                ${PROGRESSIONS.map(prog => {
                    const chordKeys = getProgChords(prog, selectedKey);
                    return `
                        <div class="prog-card-interactive" data-prog-id="${prog.id}">
                            <div class="prog-card-header">
                                <div class="prog-card-titles">
                                    <span class="prog-card-label">${prog.label}</span>
                                    <span class="prog-card-name">${prog.name}</span>
                                </div>
                                <button type="button" class="prog-play-btn" data-prog-id="${prog.id}"
                                    title="Chơi thử vòng này">▶</button>
                            </div>
                            <div class="prog-chord-pills">
                                ${chordKeys.map(k => `<span class="prog-chord-pill">${k}</span>`).join('')}
                            </div>
                            <div class="prog-card-footer">
                                <span class="prog-card-genre">${prog.genre}</span>
                                <span class="prog-card-mood">${prog.mood}</span>
                            </div>
                            <div class="prog-card-desc">${prog.description}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.prog-key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                stopAll();
                selectedKey = btn.dataset.key;
                localStorage.setItem('piano-prog-key', selectedKey);
                renderProgressions();
            });
        });

        container.querySelectorAll('.prog-voicing-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                stopAll();
                selectedVoicing = btn.dataset.voicing;
                localStorage.setItem('piano-prog-voicing', selectedVoicing);
                container.querySelectorAll('.prog-voicing-btn').forEach(b =>
                    b.classList.toggle('active', b.dataset.voicing === selectedVoicing)
                );
            });
        });

        const slider = container.querySelector('.prog-bpm-slider');
        const bpmLabel = container.querySelector('.prog-bpm-value');
        if (slider) {
            slider.addEventListener('input', () => {
                bpm = parseInt(slider.value, 10);
                if (bpmLabel) bpmLabel.textContent = bpm;
                localStorage.setItem('piano-prog-bpm', String(bpm));
            });
        }

        container.querySelectorAll('.prog-play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prog = PROGRESSIONS.find(p => p.id === btn.dataset.progId);
                if (prog) playProgression(prog, btn);
            });
        });

        // Clicking a chord pill plays just that chord
        container.querySelectorAll('.prog-chord-pill').forEach(pill => {
            const card = pill.closest('.prog-card-interactive');
            if (!card) return;
            const prog = PROGRESSIONS.find(p => p.id === card.dataset.progId);
            if (!prog) return;
            const cardIdx = Array.from(card.querySelectorAll('.prog-chord-pill')).indexOf(pill);
            const key = getProgChords(prog, selectedKey)[cardIdx];
            if (!key) return;

            pill.title = `Bấm để nghe ${key}`;
            pill.style.cursor = 'pointer';
            pill.addEventListener('click', e => {
                e.stopPropagation();
                const midi = buildVoicingMidi(key);
                if (midi.length) {
                    ChordPlayer.playWithPattern(midi, 'arpeggioUp', 1200, true);
                    ChordUI.updateKeyboardHighlight(midi);
                }
            });
        });
    }

    function init() {
        selectedKey = localStorage.getItem('piano-prog-key') || 'C';
        bpm = parseInt(localStorage.getItem('piano-prog-bpm'), 10) || 76;
        renderProgressions();
    }

    return { init, stopAll, renderProgressions };
})();
