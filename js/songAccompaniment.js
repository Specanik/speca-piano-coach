const SongAccompaniment = (() => {
    // ── Accompaniment style definitions ──────────────────────────────────────
    const STYLES = {
        ballad: {
            label: 'Ballad (đệm nhẹ)',
            preferPattern: 'arpeggioUp',
            minHoldBeats: 2,
            barBeats: 4
        },
        pop: {
            label: 'Pop (đều nhịp)',
            preferPattern: 'block',
            minHoldBeats: 1,
            barBeats: 4
        },
        folk: {
            label: 'Dân ca (chạp)',
            preferPattern: 'block',
            minHoldBeats: 2,
            barBeats: 4
        },
        waltz: {
            label: 'Waltz (3/4)',
            preferPattern: 'bassFirst',
            minHoldBeats: 3,
            barBeats: 3
        },
        bossaNova: {
            label: 'Bossa Nova',
            preferPattern: 'arpeggioUp',
            minHoldBeats: 2,
            barBeats: 4
        },
        rock: {
            label: 'Rock (mạnh)',
            preferPattern: 'block',
            minHoldBeats: 2,
            barBeats: 4
        }
    };

    function countSyllablesInText(text) {
        if (!text || !text.trim()) return 0;
        return text.split(/\s+/).filter(Boolean)
            .reduce((sum, w) => sum + SongParser.estimateSyllables(w), 0);
    }

    /** Detect verse / chorus / bridge from structure & repeated lines */
    function analyzeStructure(parsed, rawText) {
        const lines = rawText.split('\n');
        const lineTexts = lines.map(l => l.replace(/\[[^\]]+\]/g, '').trim().toLowerCase());
        const freq = new Map();
        lineTexts.forEach(t => {
            if (t.length < 8) return;
            const key = t.slice(0, 40);
            freq.set(key, (freq.get(key) || 0) + 1);
        });

        const refrainKeys = new Set(
            [...freq.entries()].filter(([, c]) => c >= 2).map(([k]) => k)
        );

        let paragraph = 0;
        const lineSection = [];
        lines.forEach((line, i) => {
            if (!line.trim()) {
                paragraph++;
                lineSection[i] = null;
            } else {
                const plain = line.replace(/\[[^\]]+\]/g, '').trim().toLowerCase();
                const isRefrain = [...refrainKeys].some(k =>
                    plain.startsWith(k.slice(0, 20)) || plain.includes(k.slice(0, 15))
                );
                lineSection[i] = isRefrain ? 'chorus' : `verse-${paragraph}`;
            }
        });

        parsed.events.forEach(ev => {
            ev.section = lineSection[ev.lineIndex] || 'verse';
            if (ev.section.startsWith('chorus')) ev.section = 'chorus';
        });

        const sections   = [...new Set(parsed.events.map(e => e.section))];
        const chordCount = parsed.events.filter(e => e.chordKey).length;

        return { lineSection, sections, refrainKeys: [...refrainKeys], chordCount };
    }

    function estimateBpm(parsed, tempoScale = 1) {
        const valid = parsed.events.filter(e => e.chordKey);
        if (!valid.length) return 72;

        const lyric = SongParser.buildTimeline(parsed, { tempoScale });
        let totalSyllables = 0;
        valid.forEach((ev, i) => {
            const next = valid[i + 1];
            const sung = next ? next.lyricsBefore : (ev.lyricsAfterTail || '');
            totalSyllables += countSyllablesInText(ev.lyricsBefore) + countSyllablesInText(sung);
        });

        const totalBeats = Math.max(valid.length * 2, totalSyllables / 1.65);
        const bpm = Math.round((totalBeats / lyric.totalMs) * 60000);
        return Math.min(96, Math.max(52, bpm || 72));
    }

    function syllablesToBeats(syllables, style) {
        const perBeat = style === 'pop' || style === 'rock' ? 1.5 : 1.75;
        return Math.max(style === 'pop' || style === 'rock' ? 1 : 2,
            Math.round((syllables / perBeat) * 2) / 2);
    }

    /** Build the strum-hit offsets (in beats) for a single chord hold */
    function buildStrumOffsets(holdBeats, styleKey, section, patternId) {
        const styleDef = STYLES[styleKey] || STYLES.ballad;
        const barB     = styleDef.barBeats || 4;
        const offsets  = [];
        const bars     = Math.ceil(holdBeats / barB);

        for (let bar = 0; bar < bars; bar++) {
            const bs = bar * barB;

            if (styleKey === 'waltz') {
                // 3/4: bass on 1, chord on 2, chord on 3
                if (bs < holdBeats)         offsets.push(bs);
                if (bs + 1 < holdBeats)     offsets.push(bs + 1);
                if (bs + 2 < holdBeats)     offsets.push(bs + 2);

            } else if (styleKey === 'folk') {
                // Traditional: beats 1, 2.5, 4 (chạp)
                offsets.push(bs);
                if (bs + 1.5 < holdBeats)   offsets.push(bs + 1.5);
                if (bs + 3 < holdBeats)     offsets.push(bs + 3);

            } else if (styleKey === 'rock') {
                // 4 even hits per bar (strong quarter-note strums)
                for (let b = 0; b < barB; b++) {
                    if (bs + b < holdBeats) offsets.push(bs + b);
                }

            } else if (styleKey === 'bossaNova') {
                // Simplified bossa syncopation: 1, 1.5, 2.5, 3, 4
                const bossaPattern = [0, 0.5, 1.5, 2, 3];
                bossaPattern.forEach(o => {
                    if (bs + o < holdBeats) offsets.push(bs + o);
                });

            } else if (styleKey === 'pop' || section === 'chorus') {
                // Even quarter-note hits
                for (let b = 0; b < barB && bs + b < holdBeats; b++) {
                    offsets.push(bs + b);
                }

            } else {
                // Ballad: beats 1 and 3 (or just 1 for short holds)
                offsets.push(bs);
                if (holdBeats - bs >= 2) offsets.push(bs + 2);
            }
        }

        const unique = [...new Set(offsets)].filter(b => b < holdBeats).sort((a, b) => a - b);
        if (!unique.length) unique.push(0);

        return unique.map((beat, idx) => {
            // Waltz: beat 0 uses bassFirst; beats 1&2 use block
            let hitPattern = patternId;
            if (styleKey === 'waltz') {
                hitPattern = (beat % styleDef.barBeats === 0) ? 'bassFirst' : 'block';
            } else if (styleKey === 'folk' || styleKey === 'bossaNova') {
                hitPattern = idx === 0 ? patternId : 'block';
            } else {
                hitPattern = beat === 0 ? patternId : (idx % 2 === 0 ? patternId : 'block');
            }

            return {
                beat,
                pattern: hitPattern,
                sustainRatio: beat === 0 ? 0.55 : 0.32,
                humanizeMs: Math.round((Math.random() - 0.5) * 24)
            };
        });
    }

    /** Build a full musical timeline aligned to beats */
    function buildMusicalTimeline(parsed, options = {}) {
        const {
            bpm = 72,
            style = 'ballad',
            tempoScale = 1,
            patternId = 'block'
        } = options;

        const beatMs   = 60000 / bpm;
        const styleDef = STYLES[style] || STYLES.ballad;
        const valid    = parsed.events.filter(e => e.chordKey);
        const lyricRef = SongParser.buildTimeline(parsed, { tempoScale });

        const steps = [];
        let beatCursor = 0;

        valid.forEach((ev, i) => {
            const ref = lyricRef.steps[i];
            const gapBeats = Math.max(1, Math.round((ref?.gapMs || beatMs) / beatMs));
            beatCursor += gapBeats;

            const next    = valid[i + 1];
            const sungText = next ? next.lyricsBefore : (ev.lyricsAfterTail || '');
            const syl = countSyllablesInText(sungText);
            let holdBeats = syllablesToBeats(syl, style);
            holdBeats = Math.max(styleDef.minHoldBeats,
                Math.round((ref?.holdMs || beatMs * 2) / beatMs));

            // Snap to bar length for waltz (multiples of 3)
            if (styleDef.barBeats === 3 && holdBeats % 3 !== 0) {
                holdBeats = Math.ceil(holdBeats / 3) * 3;
            }

            const section   = ev.section === 'chorus' ? 'chorus' : 'verse';
            const strumHits = buildStrumOffsets(holdBeats, style, section, patternId);

            steps.push({
                chordKey:    ev.chordKey,
                chordRaw:    ev.chordRaw,
                startMs:     Math.round(beatCursor * beatMs),
                holdMs:      Math.round(holdBeats * beatMs),
                beatMs,
                holdBeats,
                gapMs:       gapBeats * beatMs,
                lyricsUnder: sungText.trim().slice(0, 60),
                section,
                strumHits
            });

            beatCursor += holdBeats;
        });

        return {
            steps,
            totalMs: Math.round(beatCursor * beatMs),
            meta: { bpm, beatMs, style, mode: 'musical' }
        };
    }

    function analyze(parsed, rawText, options = {}) {
        const structure       = analyzeStructure(parsed, rawText);
        const bpm             = options.bpm || estimateBpm(parsed, options.tempoScale || 1);
        const lyricTimeline   = SongParser.buildTimeline(parsed, { tempoScale: options.tempoScale || 1 });
        const musicalTimeline = buildMusicalTimeline(parsed, {
            bpm,
            style:      options.style   || 'ballad',
            tempoScale: options.tempoScale || 1,
            patternId:  options.patternId  || 'block'
        });

        const valid    = parsed.events.filter(e => e.chordKey);
        const avgBeats = valid.length
            ? musicalTimeline.steps.reduce((s, st) => s + st.holdBeats, 0) / valid.length
            : 0;

        return {
            bpm,
            structure,
            avgBeatsPerChord:   Math.round(avgBeats * 10) / 10,
            lyricDurationSec:   Math.round(lyricTimeline.totalMs   / 1000),
            musicalDurationSec: Math.round(musicalTimeline.totalMs / 1000),
            hasChorus:          structure.sections.includes('chorus'),
            musicalTimeline,
            lyricTimeline
        };
    }

    function buildTimeline(parsed, options) {
        if (options.rawText) analyzeStructure(parsed, options.rawText);

        const mode = options.timingMode || 'musical';
        if (mode === 'lyrics') {
            const t = SongParser.buildTimeline(parsed, options);
            t.meta = { mode: 'lyrics' };
            return t;
        }

        const analysis = analyze(parsed, options.rawText || '', options);
        return analysis.musicalTimeline;
    }

    return {
        STYLES,
        analyze,
        buildTimeline,
        buildMusicalTimeline,
        estimateBpm,
        analyzeStructure
    };
})();
