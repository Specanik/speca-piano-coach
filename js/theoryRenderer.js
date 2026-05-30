/**
 * TheoryRenderer — converts raw lesson theory HTML into visual, pedagogical format.
 *
 * Automatically detects:
 *   - Chord formulas ("1 – 3 – 5") → renders as interactive note badges
 *   - Note lists ("C – E – G") → renders mini-piano diagram
 *   - h3 headings → wraps in concept-card style
 *   - Adds ▶ Play button when MIDI notes detected
 *
 * Usage: TheoryRenderer.enhance(htmlString, lessonStep) → enhanced HTML string
 *        TheoryRenderer.bindEvents(containerEl) → wire click handlers after insertion
 */
const TheoryRenderer = (() => {

    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    // Map note name → midi offset from C4 (midi 60)
    const NOTE_TO_MIDI = {
        'C': 60, 'C#': 61, 'Cs': 61, 'Db': 61,
        'D': 62, 'D#': 63, 'Ds': 63, 'Eb': 63,
        'E': 64,
        'F': 65, 'F#': 66, 'Fs': 66, 'Gb': 66,
        'G': 67, 'G#': 68, 'Gs': 68, 'Ab': 68,
        'A': 69, 'A#': 70, 'As': 70, 'Bb': 70,
        'B': 71
    };

    function noteToMidi(name) {
        return NOTE_TO_MIDI[name] ?? 60;
    }

    // ── Mini-piano HTML builder ────────────────────────────────────
    function buildMiniPiano(highlightMidis, showLabels = true, compact = false) {
        // Show 1 octave: C4–B4 (midi 60-71)
        const C4 = 60;
        const octaveMidis  = Array.from({length: 12}, (_, i) => C4 + i);
        const isBlack = m => [1,3,6,8,10].includes(m % 12);
        const isWhite = m => !isBlack(m);
        const hlSet   = new Set(highlightMidis);

        const whites = octaveMidis.filter(isWhite);
        const blacks = octaveMidis.filter(isBlack);

        // Build key positions
        let html = `<div class="mini-piano-diagram" style="${compact ? 'padding:8px 12px 10px;' : ''}">`;

        // Render white keys with black keys overlay
        let wIdx = -1;
        octaveMidis.forEach((m, i) => {
            if (isWhite(m)) {
                wIdx++;
                const hl  = hlSet.has(m);
                const name = NOTE_NAMES[m % 12];
                const octave = Math.floor(m / 12) - 1;
                html += `<div class="mini-key-w ${hl ? 'hl' : ''}"
                    data-midi="${m}"
                    title="${name}${octave}"
                    ${compact ? 'style="width:22px;height:56px;"' : ''}>
                    ${showLabels && name === 'C' ? `<span style="font-size:0.52rem;color:${hl?'#664400':'#aaa'}">${name}</span>` : ''}
                    ${showLabels && hl && name !== 'C' ? `<span style="font-size:0.52rem;color:#664400">${name}</span>` : ''}
                </div>`;
            } else {
                const hl  = hlSet.has(m);
                const name = NOTE_NAMES[m % 12];
                html += `<div class="mini-key-b ${hl ? 'hl' : ''}"
                    data-midi="${m}" title="${name}"
                    ${compact ? 'style="width:14px;height:34px;margin:0 -7px;"' : ''}>
                </div>`;
            }
        });

        html += '</div>';
        return html;
    }

    // ── Process formula strings → badge row ───────────────────────
    function processFormula(text) {
        // Match "1 – 3 – 5" or "1 – ♭3 – 5" type formulas
        if (!text.match(/\d\s*[–-]\s*[♭♯]?\d/)) return text;

        // Replace strong tags containing formulas with badge displays
        return text.replace(/<strong>([^<]+[–-][^<]+)<\/strong>/g, (match, inner) => {
            if (!inner.match(/\d/)) return match;
            const parts = inner.split(/\s*[–—-]\s*/);
            const badges = parts.map(part => {
                const trimmed = part.trim();
                let cls = 'theory-note-badge';
                if (trimmed === '1') cls += ' root';
                else if (trimmed.includes('3')) cls += ' third';
                else if (trimmed.includes('5')) cls += ' fifth';
                else if (trimmed.includes('7')) cls += ' seventh';
                return `<span class="${cls}">${trimmed}</span>`;
            }).join(`<span class="formula-arrow">→</span>`);
            return `<div class="theory-formula">${badges}</div>`;
        });
    }

    // ── Detect note sequences and render piano ────────────────────
    function detectNoteSequence(text) {
        // Match "C – E – G" or "C – E – G – B" type patterns
        const match = text.match(/\b([A-G][b#♭♯]?)\s*[–—-]\s*([A-G][b#♭♯]?)\s*[–—-]\s*([A-G][b#♭♯]?)(\s*[–—-]\s*([A-G][b#♭♯]?))?/);
        if (!match) return null;

        const notes = [match[1], match[2], match[3], match[5]].filter(Boolean);
        const midis = notes.map(n => noteToMidi(n.replace('♭','b').replace('♯','#')));
        return { notes, midis };
    }

    // ── Enhance section by section ────────────────────────────────
    function enhance(html, step) {
        if (!html) return '';

        // Split by h3 sections
        const sections = html.split(/<h3>/g);

        const result = sections.map((section, idx) => {
            if (idx === 0 && !section.trim()) return '';

            // If this isn't the first split (it contains h3 content)
            if (idx > 0) {
                const endH3 = section.indexOf('</h3>');
                const heading = endH3 >= 0 ? section.slice(0, endH3) : section.slice(0, 30);
                const body    = endH3 >= 0 ? section.slice(endH3 + 5) : section;

                // Detect chord notes for piano diagram
                const noteSeq = detectNoteSequence(body);
                const hasFormula = body.match(/\d\s*[–-]\s*[♭♯]?\d/);

                const pianoHtml = noteSeq
                    ? `<div style="margin:8px 0">${buildMiniPiano(noteSeq.midis, true, true)}
                       <div style="text-align:center;margin-top:4px">
                           <button class="theory-play-btn" data-midi='${JSON.stringify(noteSeq.midis)}'>
                               ▶ Nghe thử
                           </button>
                       </div></div>`
                    : '';

                const processedBody = processFormula(body);

                return `
                    <div class="theory-concept-card" style="margin:0 0 8px">
                        <h3 class="theory-concept-h">${heading}</h3>
                        <div class="theory-concept-body" style="padding:8px 2px 2px">
                            ${pianoHtml}
                            ${processedBody}
                        </div>
                    </div>`;
            }

            return section;
        }).join('');

        return result;
    }

    // ── Bind interactive events ────────────────────────────────────
    function bindEvents(containerEl) {
        if (!containerEl) return;

        // Play chord button
        containerEl.querySelectorAll('.theory-play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const midis = JSON.parse(btn.dataset.midi || '[]');
                // Arpeggio play
                midis.forEach((m, i) => {
                    setTimeout(() => {
                        AudioEngine.startNote(`th_${m}_${Date.now()}`, m);
                        Visualizer?.noteOn?.(m);
                    }, i * 110);
                    setTimeout(() => {
                        AudioEngine.stopNote(`th_${m}_${Date.now()}`);
                        Visualizer?.noteOff?.(m);
                    }, i * 110 + 900);
                });
            });
        });

        // Mini piano key clicks
        containerEl.querySelectorAll('.mini-piano-diagram .mini-key-w, .mini-piano-diagram .mini-key-b').forEach(key => {
            key.addEventListener('click', () => {
                const midi = parseInt(key.dataset.midi);
                if (!midi) return;
                const id = `key_${midi}_${Date.now()}`;
                AudioEngine.startNote(id, midi);
                key.style.opacity = '0.7';
                setTimeout(() => {
                    AudioEngine.stopNote(id);
                    key.style.opacity = '';
                }, 600);
            });
        });

        // Detail toggles
        containerEl.querySelectorAll('.theory-detail-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('open');
                const target = containerEl.querySelector(`#${btn.dataset.target}`);
                target?.classList.toggle('open');
            });
        });
    }

    return { enhance, bindEvents, buildMiniPiano };
})();
