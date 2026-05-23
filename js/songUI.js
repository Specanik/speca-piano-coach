const SongUI = (() => {
    const SAMPLE_SONG = `Bao ngày mẹ [Am]ngóng, bao ngày mẹ [Em]trông, bao ngày mẹ [F]mong con chào [C]đời
Ấp trong đáy [Am]lòng, có chăng tiếng [F]cười của một hài [G]nhi đang lớn [C]dần?
Mẹ chợt tỉnh [Am]giấc, và mẹ nhìn [Em]thấy hình hài nhỏ [F]bé như thiên [C]thần,
Tiếng con khóc [Am]oà, mắt mẹ lệ [Em]nhòa, cám ơn vì [F]con đến bên [Am]mẹ.

Này con [Am]yêu ơi, con biết [Em]không? mẹ yêu [F]con, yêu con nhất [C]đời
Ngắm con [Am]ngoan nằm trong [Em]nôi, mắt xoe [F]tròn, ôi bé [G]cưng
Nhìn cha [Am]con, cha đang rất [Em]vui, giọt nước [F]mắt lăn trên khóe [C]môi
Con hãy nhìn [Am]kìa, cha đang [Em]khóc vì [Am]con...

Một ngày tỉnh [Am]giấc, rồi mẹ chợt [Em]nghe, vụng về con [F]nói câu mẹ [C]ơi
Chiếc môi bé [Am]nhỏ thốt lên bất [F]ngờ, khiến tim mẹ [G]vui như vỡ [C]òa
Đây là mặt [Am]đất, này là trời [Em]cao, đây là nơi [F]đã sinh ra [C]con,
Bước chân bé [Am]nhỏ bước đi theo [Em]cha, bước chân đầu [F]tiên trên đường [Am]đời.

Này con [Am]yêu ơi, con biết [Em]không? mẹ yêu [F]con, yêu con biết [C]bao
Hãy cứ [Am]đi, mẹ bên [Em]con, dõi theo [F]con từng bước [G]chân
Ngày mai [Am]sau khi con lớn [Em]khôn, đường đời [F]không như con ước [C]mơ
Hãy đứng [Am]lên và vững [Em]bước trên đường [F]xa.

Ngày đầu đến [Am]lớp, mẹ cùng con [Em]đi, ngập ngừng con [F]bước sau lưng [C]mẹ,
Tiếng ve cuối [Am]hè, hát vang đón [F]chào, ánh mặt trời [G]soi con đến [C]trường
Ngày ngày đến [Am]lớp, dần dần con [Em]quen, bạn bè, thầy [F]cô yêu thương [C]con,
Bé con của [Am]mẹ vẫn luôn chăm [Em]ngoan, khiến cho mẹ [F]vui mãi trong [Am]lòng

Này con [Am]yêu ơi, con biết [Em]không? mẹ yêu [F]con, yêu con rất [C]nhiều
Những khuya [Am]ôn bài, con [Em]thức, xót xa [F]tim mẹ biết [G]bao
Từng kỳ [Am]thi nối tiếp [Em]nhau, tuổi thơ [F]con trôi qua rất [C]mau,
Ước chi [Am]con mẹ mai [Em]sau sẽ thành [Am]công.`;

    const LEVELS = [
        { id: 'basic', label: 'Cơ bản' },
        { id: 'intermediate', label: 'Trung' },
        { id: 'advanced', label: 'Nâng' }
    ];

    let selectedPattern = localStorage.getItem('piano-play-pattern') || 'block';
    let selectedLevel = localStorage.getItem('piano-song-level') || 'basic';
    let variationIndex = parseInt(localStorage.getItem('piano-song-variation'), 10) || 0;
    let tempoPercent = parseInt(localStorage.getItem('piano-song-tempo'), 10) || 100;
    let timingMode = localStorage.getItem('piano-song-timing-mode') || 'musical';
    let songStyle = localStorage.getItem('piano-song-style') || 'ballad';
    let bpmOverride = parseInt(localStorage.getItem('piano-song-bpm'), 10) || 0;
    let currentStepIndex = -1;
    let lastAnalysis = null;

    function tempoScale() {
        return tempoPercent / 100;
    }

    function getBuildOptions(rawText) {
        return {
            rawText,
            timingMode,
            style: songStyle,
            tempoScale: tempoScale(),
            patternId: selectedPattern,
            bpm: bpmOverride > 0 ? bpmOverride : undefined
        };
    }

    function getTimingOptions() {
        return { tempoScale: tempoScale() };
    }

    function getTimingModeHtml() {
        return `
            <div class="song-mode-row">
                <span class="play-zone-label">Cách tính nhịp</span>
                <div class="song-mode-btns">
                    <button type="button" class="song-mode-btn${timingMode === 'musical' ? ' active' : ''}" data-mode="musical">Theo nhịp</button>
                    <button type="button" class="song-mode-btn${timingMode === 'lyrics' ? ' active' : ''}" data-mode="lyrics">Theo lời</button>
                </div>
            </div>
        `;
    }

    function getStyleHtml() {
        const styles = SongAccompaniment.STYLES;
        return `
            <div class="song-style-row">
                <span class="play-zone-label">Phong cách đệm</span>
                <select id="song-style-select" class="song-style-select">
                    ${Object.entries(styles).map(([id, s]) =>
                        `<option value="${id}"${id === songStyle ? ' selected' : ''}>${s.label}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    function getBpmHtml() {
        const bpm = bpmOverride || lastAnalysis?.bpm || 72;
        return `
            <div class="song-bpm-control">
                <div class="spacing-control-header">
                    <span class="play-zone-label">BPM (nhịp/phút)</span>
                    <span class="spacing-value song-bpm-value">${bpmOverride ? bpm : bpm + ' (tự)'}</span>
                </div>
                <input type="range" class="song-bpm-slider" min="52" max="96" step="2" value="${bpmOverride || bpm}">
                <button type="button" class="song-bpm-auto" id="song-bpm-auto">Tự ước lượng</button>
            </div>
        `;
    }

    function getAnalysisHtml() {
        if (!lastAnalysis) return '';
        const a = lastAnalysis;
        return `
            <details class="song-analysis" open>
                <summary>Phân tích bài hát</summary>
                <ul class="song-analysis-list">
                    <li><strong>Nhịp:</strong> ~${a.bpm} BPM · ${timingMode === 'musical' ? '4/4, căn phách' : 'theo lời'}</li>
                    <li><strong>Độ dài:</strong> ~${Math.round((timingMode === 'musical' ? a.musicalDurationSec : a.lyricDurationSec))}s</li>
                    <li><strong>Trung bình:</strong> ${a.avgBeatsPerChord} phách / hợp âm</li>
                    <li><strong>Khổ:</strong> ${a.hasChorus ? 'có điệp khúc lặp' : 'thơ / đơn khổ'}</li>
                    <li class="song-analysis-hint">Đổi hợp âm đúng chỗ [Am] trong lời; đệm gõ thêm giữa mỗi hợp âm (chạp/rải).</li>
                </ul>
            </details>
        `;
    }

    function getLevelLabel() {
        return LEVELS.find(l => l.id === selectedLevel)?.label || selectedLevel;
    }

    function getPatternGridHtml(activeId) {
        return ChordPlayer.getPatterns().map(p => `
            <button type="button"
                class="pattern-btn song-pattern-btn${p.id === activeId ? ' active' : ''}"
                data-pattern="${p.id}">${p.label}</button>
        `).join('');
    }

    function getLevelTabsHtml() {
        return `
            <div class="level-tabs song-level-tabs" role="tablist">
                ${LEVELS.map(lvl => `
                    <button type="button" class="level-tab song-level-tab${lvl.id === selectedLevel ? ' active' : ''}"
                        data-level="${lvl.id}" role="tab">${lvl.label}</button>
                `).join('')}
            </div>
        `;
    }

    function getVariationPickerHtml() {
        return `
            <div class="song-variation-row">
                <span class="play-zone-label">Biến thể</span>
                <div class="song-variation-btns" id="song-variation-btns"></div>
            </div>
        `;
    }

    function getSpacingHtml() {
        const ms = ChordPlayer.getNoteSpacing();
        const disabled = !ChordPlayer.isSequentialPattern(selectedPattern);
        return `
            <div class="spacing-control song-spacing${disabled ? ' is-disabled' : ''}">
                <div class="spacing-control-header">
                    <span class="play-zone-label">Khoảng cách nốt</span>
                    <span class="spacing-value song-spacing-value">${ms} ms</span>
                </div>
                <input type="range" class="note-spacing-slider song-spacing-slider"
                    min="50" max="400" step="10" value="${ms}" ${disabled ? 'disabled' : ''}>
            </div>
        `;
    }

    function getTempoHtml() {
        return `
            <div class="song-tempo-control">
                <div class="spacing-control-header">
                    <span class="play-zone-label">Tốc độ đệm</span>
                    <span class="spacing-value song-tempo-value">${tempoPercent}%</span>
                </div>
                <input type="range" class="song-tempo-slider" min="70" max="130" step="5" value="${tempoPercent}">
                <div class="spacing-presets">
                    <button type="button" class="song-tempo-preset" data-pct="85">Chậm</button>
                    <button type="button" class="song-tempo-preset" data-pct="100">Vừa</button>
                    <button type="button" class="song-tempo-preset" data-pct="115">Nhanh</button>
                </div>
            </div>
        `;
    }

    function refreshVariationButtons() {
        const container = document.getElementById('song-variation-btns');
        if (!container) return;

        const refKey = ['C', 'Am', 'G'].find(k => {
            const c = ChordsDB.getChord(k);
            return c?.variations[selectedLevel]?.length;
        }) || 'C';
        const sampleChord = ChordsDB.getChord(refKey);
        if (!sampleChord) return;

        const variations = sampleChord.variations[selectedLevel] || [];
        if (!variations.length) {
            container.innerHTML = '<span class="song-var-empty">Không có ở mức này</span>';
            return;
        }

        if (variationIndex >= variations.length) variationIndex = 0;

        container.innerHTML = variations.map((v, i) => {
            const short = v.name.replace(/\(.*\)/, '').trim().slice(0, 12);
            return `
            <button type="button" class="song-variation-btn${i === variationIndex ? ' active' : ''}"
                data-index="${i}" title="${v.name}">${short || i + 1}</button>`;
        }).join('');
    }

    function renderPanel() {
        const panel = document.getElementById('chord-tab-song');
        if (!panel) return;

        const saved = localStorage.getItem('piano-song-text') || SAMPLE_SONG;

        panel.innerHTML = `
            <div class="song-panel">
                <label class="play-zone-label" for="song-lyrics-input">Lời + hợp âm [Am]</label>
                <textarea id="song-lyrics-input" class="song-lyrics-input" rows="7"
                    placeholder="Dán lời bài hát, hợp âm trong ngoặc vuông...">${saved}</textarea>
                <div class="song-actions">
                    <button type="button" class="song-btn song-btn-play" id="song-play-btn">▶ Đệm hát</button>
                    <button type="button" class="song-btn song-btn-stop" id="song-stop-btn" disabled>■ Dừng</button>
                    <button type="button" class="song-btn song-btn-sample" id="song-sample-btn">Mẫu</button>
                </div>
                <p class="song-status" id="song-status">Phân tích để xem trước</p>
                <div id="song-analysis-slot">${getAnalysisHtml()}</div>
                <div class="song-play-zone">
                    ${getTimingModeHtml()}
                    ${getStyleHtml()}
                    ${getBpmHtml()}
                    ${getLevelTabsHtml()}
                    ${getVariationPickerHtml()}
                    <span class="play-zone-label">Kiểu đánh</span>
                    <div class="pattern-grid song-pattern-grid">${getPatternGridHtml(selectedPattern)}</div>
                    ${getSpacingHtml()}
                    ${getTempoHtml()}
                </div>
                <ol class="song-preview" id="song-preview"></ol>
            </div>
        `;

        bindPanelEvents();
        refreshVariationButtons();
        analyzeAndPreview();
    }

    function analyzeAndPreview() {
        const input = document.getElementById('song-lyrics-input');
        const status = document.getElementById('song-status');
        const preview = document.getElementById('song-preview');
        if (!input || !status || !preview) return;

        localStorage.setItem('piano-song-text', input.value);
        const parsed = SongParser.parse(input.value);

        if (!parsed.chordCount) {
            status.textContent = 'Chưa có hợp âm [Am], [C7]... trong lời';
            status.className = 'song-status song-status--warn';
            preview.innerHTML = '';
            lastAnalysis = null;
            const slot = document.getElementById('song-analysis-slot');
            if (slot) slot.innerHTML = '';
            return;
        }

        lastAnalysis = SongAccompaniment.analyze(parsed, input.value, getBuildOptions(input.value));
        const timeline = SongAccompaniment.buildTimeline(parsed, getBuildOptions(input.value));
        const levelLabel = getLevelLabel();
        const modeLabel = timingMode === 'musical' ? 'nhịp' : 'lời';

        const slot = document.getElementById('song-analysis-slot');
        if (slot) slot.innerHTML = getAnalysisHtml();

        if (parsed.unknown.length) {
            status.textContent = `${parsed.chordCount} HA · ${levelLabel} · ${modeLabel} · ${parsed.unknown.length} lỗi`;
            status.className = 'song-status song-status--warn';
        } else {
            const sec = (timeline.totalMs / 1000).toFixed(0);
            const strums = timeline.steps[0]?.strumHits?.length || 0;
            status.textContent = `${parsed.chordCount} HA · ${levelLabel} · ~${sec}s · ${modeLabel}${timingMode === 'musical' ? ` · ${strums}+ nhịp/đoạn` : ''}`;
            status.className = 'song-status';
        }

        preview.innerHTML = timeline.steps.slice(0, 20).map((s, i) => {
            const hits = s.strumHits?.length || 1;
            const sec = s.section === 'chorus' ? 'ĐK' : '';
            return `<li class="song-preview-item${i === currentStepIndex ? ' active' : ''}" data-step="${i}">
                <span class="song-preview-chord">${s.chordKey}${sec ? ' ' + sec : ''}</span>
                <span class="song-preview-lyric" title="${s.lyricsUnder || ''}">${hits} nhịp · ${(s.lyricsUnder || '…').slice(0, 16)}</span>
                <span class="song-preview-time">${(s.startMs / 1000).toFixed(1)}s</span>
            </li>`;
        }).join('') + (timeline.steps.length > 20 ? '<li class="song-preview-more">…</li>' : '');
    }

    function bindPanelEvents() {
        const panel = document.getElementById('chord-tab-song');
        const input = document.getElementById('song-lyrics-input');
        if (!panel || !input) return;

        let debounce;
        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(analyzeAndPreview, 300);
        });

        document.getElementById('song-play-btn')?.addEventListener('click', startPlay);
        document.getElementById('song-stop-btn')?.addEventListener('click', stopPlay);
        document.getElementById('song-sample-btn')?.addEventListener('click', () => {
            input.value = SAMPLE_SONG;
            analyzeAndPreview();
        });

        document.getElementById('song-bpm-auto')?.addEventListener('click', () => {
            bpmOverride = 0;
            localStorage.removeItem('piano-song-bpm');
            analyzeAndPreview();
        });

        panel.addEventListener('click', e => {
            const modeBtn = e.target.closest('.song-mode-btn');
            if (modeBtn) {
                timingMode = modeBtn.dataset.mode;
                localStorage.setItem('piano-song-timing-mode', timingMode);
                panel.querySelectorAll('.song-mode-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.mode === timingMode);
                });
                analyzeAndPreview();
                return;
            }

            const levelTab = e.target.closest('.song-level-tab');
            if (levelTab) {
                selectedLevel = levelTab.dataset.level;
                localStorage.setItem('piano-song-level', selectedLevel);
                panel.querySelectorAll('.song-level-tab').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.level === selectedLevel);
                });
                variationIndex = 0;
                localStorage.setItem('piano-song-variation', '0');
                refreshVariationButtons();
                analyzeAndPreview();
                return;
            }

            const varBtn = e.target.closest('.song-variation-btn');
            if (varBtn) {
                variationIndex = parseInt(varBtn.dataset.index, 10);
                localStorage.setItem('piano-song-variation', String(variationIndex));
                panel.querySelectorAll('.song-variation-btn').forEach(btn => {
                    btn.classList.toggle('active', parseInt(btn.dataset.index, 10) === variationIndex);
                });
                return;
            }

            const patternBtn = e.target.closest('.song-pattern-btn');
            if (patternBtn) {
                selectedPattern = patternBtn.dataset.pattern;
                localStorage.setItem('piano-play-pattern', selectedPattern);
                panel.querySelectorAll('.song-pattern-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.pattern === selectedPattern);
                });
                const spacing = panel.querySelector('.song-spacing');
                if (spacing) spacing.classList.toggle('is-disabled', !ChordPlayer.isSequentialPattern(selectedPattern));
                const slider = panel.querySelector('.song-spacing-slider');
                if (slider) slider.disabled = !ChordPlayer.isSequentialPattern(selectedPattern);
                return;
            }

            const tempoPreset = e.target.closest('.song-tempo-preset');
            if (tempoPreset) {
                applyTempoPercent(parseInt(tempoPreset.dataset.pct, 10));
                analyzeAndPreview();
            }
        });

        panel.addEventListener('change', e => {
            if (e.target.id === 'song-style-select') {
                songStyle = e.target.value;
                localStorage.setItem('piano-song-style', songStyle);
                analyzeAndPreview();
            }
        });

        panel.addEventListener('input', e => {
            if (e.target.classList.contains('song-bpm-slider')) {
                bpmOverride = parseInt(e.target.value, 10);
                localStorage.setItem('piano-song-bpm', String(bpmOverride));
                const label = panel.querySelector('.song-bpm-value');
                if (label) label.textContent = String(bpmOverride);
                analyzeAndPreview();
            }
            if (e.target.classList.contains('song-spacing-slider')) {
                const ms = parseInt(e.target.value, 10);
                ChordPlayer.setNoteSpacing(ms);
                localStorage.setItem('piano-chord-spacing', String(ms));
                const label = panel.querySelector('.song-spacing-value');
                if (label) label.textContent = `${ms} ms`;
            }
            if (e.target.classList.contains('song-tempo-slider')) {
                applyTempoPercent(parseInt(e.target.value, 10));
                analyzeAndPreview();
            }
        });
    }

    function applyTempoPercent(pct) {
        tempoPercent = pct;
        localStorage.setItem('piano-song-tempo', String(pct));
        const label = document.querySelector('.song-tempo-value');
        const slider = document.querySelector('.song-tempo-slider');
        if (label) label.textContent = `${pct}%`;
        if (slider) slider.value = String(pct);
    }

    function setPlayingUI(playing) {
        document.getElementById('song-play-btn')?.toggleAttribute('disabled', playing);
        document.getElementById('song-stop-btn')?.toggleAttribute('disabled', !playing);
        document.getElementById('song-lyrics-input')?.toggleAttribute('readonly', playing);
    }

    function highlightStep(index) {
        currentStepIndex = index;
        document.querySelectorAll('.song-preview-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.step, 10) === index);
        });
    }

    function startPlay() {
        const input = document.getElementById('song-lyrics-input');
        if (!input) return;

        const parsed = SongParser.parse(input.value);
        const timeline = SongAccompaniment.buildTimeline(parsed, getBuildOptions(input.value));

        if (!timeline.steps.length) {
            analyzeAndPreview();
            return;
        }

        ChordUI.closeChordPanel?.();
        setPlayingUI(true);
        currentStepIndex = -1;

        SongPlayer.play(
            timeline,
            selectedPattern,
            selectedLevel,
            variationIndex,
            (index) => highlightStep(index),
            () => {
                setPlayingUI(false);
                currentStepIndex = -1;
                document.querySelectorAll('.song-preview-item').forEach(el => el.classList.remove('active'));
            }
        );
    }

    function stopPlay() {
        SongPlayer.stop();
        setPlayingUI(false);
        currentStepIndex = -1;
        document.querySelectorAll('.song-preview-item').forEach(el => el.classList.remove('active'));
    }

    function init() {
        renderPanel();
    }

    function onTabShown() {
        if (!document.getElementById('song-lyrics-input')) renderPanel();
        else analyzeAndPreview();
    }

    function stopIfPlaying() {
        if (SongPlayer.isPlaying()) stopPlay();
    }

    return { init, onTabShown, stopIfPlaying };
})();
