const SongParser = (() => {
    const CHORD_RE = /\[([^\]]+)\]/g;

    const PUNCT_PAUSE = {
        ',': 220,
        ';': 260,
        ':': 240,
        '.': 380,
        '!': 360,
        '?': 400,
        '…': 450,
        '...': 450
    };

    function parse(text) {
        const lines = text.split('\n');
        const events = [];
        let carry = '';

        lines.forEach((line, lineIndex) => {
            const trimmed = line.trim();
            if (!trimmed) {
                carry += '\n\n';
                return;
            }

            let pos = 0;
            let match;
            CHORD_RE.lastIndex = 0;

            while ((match = CHORD_RE.exec(trimmed))) {
                const before = trimmed.slice(pos, match.index);
                events.push({
                    lyricsBefore: carry + before,
                    chordRaw: match[1].trim(),
                    lineIndex
                });
                carry = '';
                pos = match.index + match[0].length;
            }

            carry += trimmed.slice(pos) + ' ';
        });

        if (carry.trim() && events.length) {
            events[events.length - 1].lyricsAfterTail = carry.trim();
        }

        const unknown = new Set();
        const resolved = events.map((ev, index) => {
            const chordKey = ChordsDB.resolveChordKey(ev.chordRaw);
            if (!chordKey) unknown.add(ev.chordRaw);
            return { ...ev, chordKey, index };
        });

        return {
            events: resolved,
            unknown: [...unknown],
            chordCount: resolved.filter(e => e.chordKey).length
        };
    }

    /** Duration from lyrics: words + punctuation pauses + line breaks */
    function lyricsDurationMs(text, options = {}) {
        const {
            msPerWord = 118,
            msPerSyllable = 52,
            minPhraseMs = 90,
            minSegmentMs = 160,
            lineBreakMs = 480,
            tempoScale = 1
        } = options;

        const raw = (text || '');
        if (!raw.trim()) return 0;

        let total = 0;
        const paragraphs = raw.split(/\n\n+/);

        paragraphs.forEach((para, pi) => {
            if (pi > 0) total += lineBreakMs * tempoScale;

            const phrases = para.split(/([,;:.!?…]|\.\.\.)/).filter(p => p !== undefined && p !== '');

            let textBuffer = '';

            const flushText = () => {
                const chunk = textBuffer.trim();
                textBuffer = '';
                if (!chunk) return;

                const words = chunk.split(/\s+/).filter(Boolean);
                let phraseMs = 0;

                words.forEach((word, wi) => {
                    const syllables = estimateSyllables(word);
                    phraseMs += msPerSyllable * syllables * tempoScale;
                    if (wi < words.length - 1) {
                        phraseMs += msPerWord * 0.35 * tempoScale;
                    }
                });

                phraseMs = Math.max(minPhraseMs, phraseMs);
                total += phraseMs;
            };

            phrases.forEach(part => {
                if (/^(\.\.\.|…|[,;:.!?])$/.test(part.trim())) {
                    flushText();
                    const pause = PUNCT_PAUSE[part.trim()] || PUNCT_PAUSE['.'];
                    total += pause * tempoScale;
                } else {
                    textBuffer += part;
                }
            });

            flushText();
        });

        return Math.max(raw.trim() ? minSegmentMs : 0, Math.round(total));
    }

    /** Rough Vietnamese syllable count for timing */
    function estimateSyllables(word) {
        const w = word.toLowerCase().replace(/[^a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, '');
        if (!w) return 1;
        const vowelGroups = w.match(/[aeiouyàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+/gi);
        return Math.max(1, vowelGroups ? vowelGroups.length : Math.ceil(w.length / 2.5));
    }

    function buildTimeline(parsed, options) {
        const {
            msPerWord = 118,
            msPerSyllable = 52,
            minSegmentMs = 160,
            lineBreakMs = 480,
            endPaddingMs = 600,
            tempoScale = 1
        } = options;

        const timingOpts = { msPerWord, msPerSyllable, minSegmentMs, lineBreakMs, tempoScale };

        const valid = parsed.events.filter(e => e.chordKey);
        const timeline = [];
        let t = 0;

        valid.forEach((ev, i) => {
            const gap = lyricsDurationMs(ev.lyricsBefore, timingOpts);
            t += gap;

            const next = valid[i + 1];
            const sungUnderChord = next
                ? next.lyricsBefore
                : (ev.lyricsAfterTail || '');

            const holdMs = lyricsDurationMs(sungUnderChord, timingOpts)
                + (i === valid.length - 1 ? endPaddingMs : 0);

            timeline.push({
                chordKey: ev.chordKey,
                chordRaw: ev.chordRaw,
                startMs: t,
                holdMs: Math.max(holdMs, minSegmentMs),
                gapMs: gap,
                lyricsUnder: sungUnderChord.trim().slice(0, 60)
            });

            t += holdMs;
        });

        return { steps: timeline, totalMs: t };
    }

    return { parse, buildTimeline, lyricsDurationMs, estimateSyllables };
})();
