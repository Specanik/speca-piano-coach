const ChordUI = (() => {
    let currentChord = null;
    let selectedPattern = localStorage.getItem('piano-play-pattern') || 'block';
    let selectedLevel = 'basic';

    const LEVELS = [
        { id: 'basic', label: 'Cơ bản' },
        { id: 'intermediate', label: 'Trung' },
        { id: 'advanced', label: 'Nâng' }
    ];

    let sidebarTab = 'browse';

    function init() {
        setupSidebarTabs();
        setupSearchBar();
        setupChordTree();
        setupChordPanel();
        SongUI.init();
    }

    function setupSidebarTabs() {
        const saved = localStorage.getItem('piano-chord-tab');
        if (saved === 'search' || saved === 'browse' || saved === 'song') sidebarTab = saved;

        const tabBtns = document.querySelectorAll('.chord-tab-btn');
        const browsePanel = document.getElementById('chord-tab-browse');
        const searchPanel = document.getElementById('chord-tab-search');
        const songPanel = document.getElementById('chord-tab-song');
        const detailPanel = document.getElementById('chord-detail-panel');

        function setTab(tab) {
            if (sidebarTab === 'song' && tab !== 'song') SongUI.stopIfPlaying();

            sidebarTab = tab;
            localStorage.setItem('piano-chord-tab', tab);

            tabBtns.forEach(btn => {
                const active = btn.dataset.tab === tab;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-selected', String(active));
            });

            if (browsePanel) {
                browsePanel.classList.toggle('active', tab === 'browse');
                browsePanel.hidden = tab !== 'browse';
            }
            if (searchPanel) {
                searchPanel.classList.toggle('active', tab === 'search');
                searchPanel.hidden = tab !== 'search';
            }
            if (songPanel) {
                songPanel.classList.toggle('active', tab === 'song');
                songPanel.hidden = tab !== 'song';
            }

            if (detailPanel && tab === 'song') {
                detailPanel.classList.remove('active');
                detailPanel.setAttribute('aria-hidden', 'true');
            }

            const resultsList = document.getElementById('chord-results');
            if (tab !== 'search' && resultsList) resultsList.innerHTML = '';

            if (tab === 'search') {
                document.getElementById('chord-search')?.focus();
            }
            if (tab === 'song') {
                SongUI.onTabShown();
            }
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => setTab(btn.dataset.tab));
        });

        setTab(sidebarTab);
    }

    function selectChord(chordKey) {
        SongUI.stopIfPlaying();
        selectedLevel = 'basic';
        selectedPattern = localStorage.getItem('piano-play-pattern') || selectedPattern;
        showChordDetails(chordKey);

        const searchInput = document.getElementById('chord-search');
        const resultsList = document.getElementById('chord-results');
        if (searchInput) searchInput.value = '';
        if (resultsList) resultsList.innerHTML = '';

        document.querySelectorAll('.chord-tree-item').forEach(el => {
            el.classList.toggle('selected', el.dataset.chord === chordKey);
        });

        const group = ChordsDB.getChordTree().find(g => g.chords.some(c => c.key === chordKey));
        if (group) {
            const treeGroup = document.querySelector(`.chord-tree-group[data-root="${group.id}"]`);
            if (treeGroup) {
                treeGroup.classList.add('is-open');
                const folder = treeGroup.querySelector('.chord-tree-folder');
                if (folder) folder.setAttribute('aria-expanded', 'true');
            }
        }
    }

    function renderChordTree() {
        const treeEl = document.getElementById('chord-tree');
        if (!treeEl) return;

        const groups = ChordsDB.getChordTree();
        treeEl.innerHTML = groups.map(g => `
            <div class="chord-tree-group" data-root="${g.id}">
                <button type="button" class="chord-tree-folder" data-root="${g.id}" aria-expanded="false">
                    <span class="folder-chevron" aria-hidden="true"></span>
                    <span class="folder-label">${g.label}</span>
                    <span class="folder-count">${g.chords.length}</span>
                </button>
                <ul class="chord-tree-children">
                    ${g.chords.map(c => `
                        <li>
                            <button type="button" class="chord-tree-item" data-chord="${c.key}"
                                title="${c.name}">
                                <span class="tree-item-key">${c.label}</span>
                                <span class="tree-item-type">${c.typeLabel}</span>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    }

    function setupChordTree() {
        renderChordTree();
        const treeEl = document.getElementById('chord-tree');
        if (!treeEl) return;

        treeEl.addEventListener('click', e => {
            const folder = e.target.closest('.chord-tree-folder');
            if (folder) {
                const group = folder.closest('.chord-tree-group');
                const isOpen = group.classList.toggle('is-open');
                folder.setAttribute('aria-expanded', String(isOpen));
                return;
            }

            const item = e.target.closest('.chord-tree-item');
            if (item) selectChord(item.dataset.chord);
        });
    }

    function setupSearchBar() {
        const searchInput = document.getElementById('chord-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', e => {
            const query = e.target.value;
            const results = ChordsDB.searchChords(query);
            displaySearchResults(results);
        });

        searchInput.addEventListener('focus', () => {
            if (sidebarTab !== 'search') return;
            if (!searchInput.value) {
                displaySearchResults(ChordsDB.getAllChords());
            }
        });
    }

    function displaySearchResults(chords) {
        const resultsList = document.getElementById('chord-results');
        if (!resultsList) return;

        resultsList.innerHTML = '';

        if (chords.length === 0) {
            resultsList.innerHTML = '<div class="no-results">Không tìm thấy hợp âm</div>';
            return;
        }

        chords.forEach(chord => {
            const li = document.createElement('li');
            li.className = 'chord-result-item';
            li.innerHTML = `
                <span class="chord-name">${chord.name}</span>
                <span class="chord-aliases">${chord.aliases.join(', ')}</span>
            `;
            li.addEventListener('click', () => selectChord(chord.key));
            resultsList.appendChild(li);
        });
    }

    function shortVariationName(name) {
        const parts = name.split('(');
        return parts[0].trim();
    }

    function formatNoteBadges(midi) {
        return midi.map(m => `${ChordsDB.NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`).join(' ');
    }

    function renderLevelTabs(chord) {
        return `
            <div class="level-tabs" role="tablist">
                ${LEVELS.map(lvl => {
                    const count = (chord.variations[lvl.id] || []).length;
                    const disabled = count === 0 ? ' disabled' : '';
                    const active = lvl.id === selectedLevel ? ' active' : '';
                    return `
                        <button type="button" class="level-tab${active}${disabled}"
                            role="tab" data-level="${lvl.id}"
                            ${count === 0 ? 'disabled' : ''}>
                            ${lvl.label}${count ? ` (${count})` : ''}
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderPatternGrid() {
        const patterns = ChordPlayer.getPatterns();
        return `
            <div class="pattern-grid pattern-grid--3" role="group" aria-label="Kiểu đánh">
                ${patterns.map(p => `
                    <button type="button"
                        class="pattern-btn${p.id === selectedPattern ? ' active' : ''}"
                        data-pattern="${p.id}"
                        title="${p.label}">${p.label}</button>
                `).join('')}
            </div>
        `;
    }

    function renderSpacingControl() {
        const ms = ChordPlayer.getNoteSpacing();
        const disabled = !ChordPlayer.isSequentialPattern(selectedPattern);
        return `
            <div class="spacing-control${disabled ? ' is-disabled' : ''}">
                <div class="spacing-control-header">
                    <span class="play-zone-label">Khoảng cách nốt</span>
                    <span class="spacing-value">${ms} ms</span>
                </div>
                <input type="range" class="note-spacing-slider"
                    min="50" max="400" step="10" value="${ms}"
                    ${disabled ? 'disabled' : ''}
                    aria-label="Khoảng cách giữa các nốt khi rải">
                <div class="spacing-presets" role="group" aria-label="Preset tốc độ rải">
                    <button type="button" class="spacing-preset" data-ms="80">Nhanh</button>
                    <button type="button" class="spacing-preset" data-ms="130">Vừa</button>
                    <button type="button" class="spacing-preset" data-ms="220">Chậm</button>
                </div>
            </div>
        `;
    }

    function syncSpacingControlUI(content) {
        const control = content?.querySelector('.spacing-control');
        if (!control) return;
        const disabled = !ChordPlayer.isSequentialPattern(selectedPattern);
        control.classList.toggle('is-disabled', disabled);
        const slider = control.querySelector('.note-spacing-slider');
        if (slider) slider.disabled = disabled;
    }

    function applyNoteSpacing(content, ms) {
        ChordPlayer.setNoteSpacing(ms);
        localStorage.setItem('piano-chord-spacing', String(ms));
        const label = content.querySelector('.spacing-value');
        const slider = content.querySelector('.note-spacing-slider');
        if (label) label.textContent = `${ms} ms`;
        if (slider) slider.value = String(ms);
    }

    function renderVariationPlays(chordName, chord) {
        const variations = chord.variations[selectedLevel] || [];
        if (variations.length === 0) {
            return '<p class="variation-empty">Không có biến thể ở mức này</p>';
        }

        return `
            <div class="variation-plays">
                ${variations.map((v, i) => `
                    <button type="button" class="variation-play-btn"
                        data-chord="${chordName}" data-type="${selectedLevel}" data-index="${i}"
                        title="${v.name}">
                        <span class="variation-play-name">${shortVariationName(v.name)}</span>
                        <span class="variation-play-notes">${formatNoteBadges(v.midi)}</span>
                        <span class="variation-play-icon" aria-hidden="true">▶</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function renderPlayZone(chordName, chord) {
        return `
            <section class="chord-play-zone">
                ${renderLevelTabs(chord)}
                <div class="play-zone-row">
                    <span class="play-zone-label">Kiểu đánh</span>
                    ${renderPatternGrid()}
                </div>
                ${renderSpacingControl()}
                <div class="play-zone-row">
                    <span class="play-zone-label">Nghe thử</span>
                    <div id="variation-plays-container">
                        ${renderVariationPlays(chordName, chord)}
                    </div>
                </div>
            </section>
        `;
    }

    function refreshVariationPlays(chordName) {
        const chord = ChordsDB.getChord(chordName);
        const container = document.getElementById('variation-plays-container');
        if (!chord || !container) return;
        container.innerHTML = renderVariationPlays(chordName, chord);
    }

    function showChordDetails(chordName) {
        currentChord = chordName;
        selectedPattern = localStorage.getItem('piano-play-pattern') || selectedPattern;
        const chord = ChordsDB.getChord(chordName);
        if (!chord) return;

        const levelsWithItems = LEVELS.filter(l => (chord.variations[l.id] || []).length > 0);
        if (levelsWithItems.length && !levelsWithItems.find(l => l.id === selectedLevel)) {
            selectedLevel = levelsWithItems[0].id;
        }

        const panel = document.getElementById('chord-detail-panel');
        const content = document.getElementById('chord-details-content');
        const titleEl = panel?.querySelector('.chord-detail-panel-title');

        if (titleEl) titleEl.textContent = chord.name;

        content.innerHTML = `
            ${renderPlayZone(chordName, chord)}

            <details class="chord-info-details">
                <summary>Mô tả & cách bấm</summary>
                <div class="chord-detail-header">
                    <p class="chord-aliases">${chord.aliases.join(' / ')}</p>
                    <p class="chord-description">${chord.description}</p>
                </div>
                <div class="chord-voicings">
                    <ul>
                        ${chord.voicings.map(v => `<li>${v}</li>`).join('')}
                    </ul>
                </div>
            </details>
        `;

        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');

        const body = panel.querySelector('.chord-detail-panel-body');
        if (body) body.scrollTop = 0;
    }

    function closeChordPanel() {
        const panel = document.getElementById('chord-detail-panel');
        if (panel) {
            panel.classList.remove('active');
            panel.setAttribute('aria-hidden', 'true');
        }
        document.querySelectorAll('.chord-tree-item.selected').forEach(el => {
            el.classList.remove('selected');
        });
        ChordPlayer.stopChord();
    }

    function setupChordPanel() {
        const closeBtn = document.querySelector('.chord-detail-panel-close');
        const content = document.getElementById('chord-details-content');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeChordPanel);
        }

        if (content) {
            content.addEventListener('input', e => {
                if (e.target.classList.contains('note-spacing-slider')) {
                    applyNoteSpacing(content, parseInt(e.target.value, 10));
                }
            });

            content.addEventListener('click', e => {
                const preset = e.target.closest('.spacing-preset');
                if (preset && !preset.closest('.spacing-control.is-disabled')) {
                    applyNoteSpacing(content, parseInt(preset.dataset.ms, 10));
                    return;
                }

                const levelTab = e.target.closest('.level-tab');
                if (levelTab && !levelTab.disabled) {
                    selectedLevel = levelTab.dataset.level;
                    content.querySelectorAll('.level-tab').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.level === selectedLevel);
                    });
                    if (currentChord) refreshVariationPlays(currentChord);
                    return;
                }

                const patternBtn = e.target.closest('.pattern-btn');
                if (patternBtn) {
                    selectedPattern = patternBtn.dataset.pattern;
                    localStorage.setItem('piano-play-pattern', selectedPattern);
                    content.querySelectorAll('.pattern-btn').forEach(btn => {
                        btn.classList.toggle('active', btn.dataset.pattern === selectedPattern);
                    });
                    syncSpacingControlUI(content);
                    return;
                }

                const playBtn = e.target.closest('.variation-play-btn');
                if (playBtn) {
                    playVariationChord(
                        playBtn.dataset.chord,
                        playBtn.dataset.type,
                        parseInt(playBtn.dataset.index, 10),
                        playBtn
                    );
                }
            });
        }
    }

    function playVariationChord(chordName, type, index, btnElement) {
        const midiNotes = ChordsDB.getMidiNotes(chordName, type, index);
        if (midiNotes.length === 0) return;

        const icon = btnElement.querySelector('.variation-play-icon');
        btnElement.classList.add('playing');
        btnElement.disabled = true;
        if (icon) icon.textContent = '⏸';

        ChordPlayer.playWithPattern(midiNotes, selectedPattern);

        const waitMs = ChordPlayer.getEstimatedDuration(midiNotes.length, selectedPattern) + 150;
        setTimeout(() => {
            btnElement.classList.remove('playing');
            btnElement.disabled = false;
            if (icon) icon.textContent = '▶';
        }, waitMs);
    }

    function updateKeyboardHighlight(midiNotes) {
        document.querySelectorAll('[data-midi]').forEach(el => {
            const midi = parseInt(el.dataset.midi, 10);
            el.classList.toggle('chord-highlight', midiNotes.includes(midi));
        });
    }

    return {
        init,
        showChordDetails,
        updateKeyboardHighlight,
        closeChordPanel
    };
})();
