const ChordUI = (() => {
    let currentChord = null;

    function init() {
        setupSearchBar();
        setupChordModal();
    }

    function setupSearchBar() {
        const searchInput = document.getElementById('chord-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', e => {
            const query = e.target.value;
            const results = ChordsDB.searchChords(query);
            displaySearchResults(results);
        });

        // Show all chords on initial click
        searchInput.addEventListener('focus', () => {
            if (!searchInput.value) {
                const allChords = ChordsDB.getAllChords();
                displaySearchResults(allChords);
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
            li.addEventListener('click', () => {
                showChordDetails(chord.key);
                document.getElementById('chord-search').value = '';
                resultsList.innerHTML = '';
            });
            resultsList.appendChild(li);
        });
    }

    function showChordDetails(chordName) {
        currentChord = chordName;
        const chord = ChordsDB.getChord(chordName);
        if (!chord) return;

        const modal = document.getElementById('chord-modal');
        const content = document.getElementById('chord-details-content');

        content.innerHTML = `
            <div class="chord-detail-header">
                <h2>${chord.name}</h2>
                <p class="chord-aliases">${chord.aliases.join(' / ')}</p>
                <p class="chord-description">${chord.description}</p>
            </div>

            <div class="chord-voicings">
                <h3>Cách Bấm Cơ Bản</h3>
                <ul>
                    ${chord.voicings.map(v => `<li>${v}</li>`).join('')}
                </ul>
            </div>

            <div class="chord-variations">
                <div class="variation-section">
                    <h3>🎯 Cơ Bản</h3>
                    <div class="variations-list">
                        ${(chord.variations.basic || []).map((v, i) => createVariationCard(chordName, 'basic', i, v)).join('')}
                    </div>
                </div>

                <div class="variation-section">
                    <h3>📊 Trung Cấp</h3>
                    <div class="variations-list">
                        ${(chord.variations.intermediate || []).map((v, i) => createVariationCard(chordName, 'intermediate', i, v)).join('')}
                    </div>
                </div>

                <div class="variation-section">
                    <h3>🚀 Nâng Cao</h3>
                    <div class="variations-list">
                        ${(chord.variations.advanced || []).map((v, i) => createVariationCard(chordName, 'advanced', i, v)).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    function createVariationCard(chordName, type, index, variation) {
        return `
            <div class="variation-card">
                <div class="variation-header">
                    <span class="variation-name">${variation.name}</span>
                    <span class="variation-difficulty">${variation.difficulty}</span>
                </div>
                <div class="variation-notes">
                    ${variation.midi.map((m, i) => `<span class="note-badge">${ChordsDB.NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}</span>`).join('')}
                </div>
                <button class="play-chord-btn" data-chord="${chordName}" data-type="${type}" data-index="${index}">
                    ▶ Nghe Thử
                </button>
            </div>
        `;
    }

    function setupChordModal() {
        const modal = document.getElementById('chord-modal');
        const closeBtn = document.querySelector('.chord-modal-close');
        const container = document.getElementById('chord-details-content');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
                ChordPlayer.stopChord();
            });
        }

        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    ChordPlayer.stopChord();
                }
            });
        }

        // Delegate click to play buttons
        if (container) {
            container.addEventListener('click', e => {
                if (e.target.classList.contains('play-chord-btn')) {
                    const chordName = e.target.dataset.chord;
                    const type = e.target.dataset.type;
                    const index = parseInt(e.target.dataset.index);
                    playVariationChord(chordName, type, index, e.target);
                }
            });
        }
    }

    function playVariationChord(chordName, type, index, btnElement) {
        const midiNotes = ChordsDB.getMidiNotes(chordName, type, index);
        if (midiNotes.length === 0) return;

        // Visual feedback on button
        btnElement.textContent = '⏸ Đang phát...';
        btnElement.disabled = true;

        ChordPlayer.playChordHarmonically(midiNotes, 1500);

        setTimeout(() => {
            btnElement.textContent = '▶ Nghe Thử';
            btnElement.disabled = false;
        }, 1500);
    }

    function updateKeyboardHighlight(midiNotes) {
        document.querySelectorAll('[data-midi]').forEach(el => {
            const midi = parseInt(el.dataset.midi);
            if (midiNotes.includes(midi)) {
                el.classList.add('chord-highlight');
            } else {
                el.classList.remove('chord-highlight');
            }
        });
    }

    return {
        init,
        showChordDetails,
        updateKeyboardHighlight
    };
})();
