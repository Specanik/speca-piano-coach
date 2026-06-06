/**
 * SongsView — Song library + play-along UI (Phase 2: Spotify-style redesign).
 * Renders inside the "Songs" practice tab.
 */
const SongsView = (() => {
    let _activeSongId = null;
    let _playing      = false;
    let _waitMode     = true;

    const DIFF_INFO = {
        beginner:     { label: '🟢 Cơ bản',    cls: 'beginner' },
        intermediate: { label: '🟡 Trung cấp',  cls: 'intermediate' },
        advanced:     { label: '🔴 Nâng cao',   cls: 'advanced' },
    };

    // BPM range mapped to fill percentage (60 BPM → 10%, 180 BPM → 100%)
    function _bpmPct(bpm) { return Math.min(100, Math.max(5, ((bpm - 60) / 120) * 95 + 5)); }

    function render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const songs   = SongsData.getAll();
        const grouped = {};
        ['beginner', 'intermediate', 'advanced'].forEach(d => {
            grouped[d] = songs.filter(s => s.difficulty === d);
        });

        container.innerHTML = `
            <div class="songs-library">
                <div class="songs-library-heading">🎵 Thư viện bài nhạc</div>
                ${['beginner', 'intermediate', 'advanced']
                    .filter(d => grouped[d].length > 0)
                    .map(d => `
                    <div class="songs-section">
                        <div class="songs-section-label ${d}">${DIFF_INFO[d].label}</div>
                        <div class="songs-row">
                            ${grouped[d].map(song => {
                                const pct = _bpmPct(song.bpm);
                                return `
                                <div class="song-card ${_activeSongId === song.id && _playing ? 'playing' : ''}"
                                    data-song-id="${song.id}" role="button" tabindex="0"
                                    title="${song.title} · ${song.artist}">
                                    <div class="song-card-art ${d}">
                                        ${song.thumbnail}
                                        <div class="song-card-bpm-bar">
                                            <div class="song-card-bpm-fill" style="width:${pct}%"></div>
                                        </div>
                                    </div>
                                    <div class="song-card-title">${song.title}</div>
                                    <div class="song-card-meta">${song.artist}</div>
                                    <div class="song-card-bpm">♩ ${song.bpm} BPM</div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`
                ).join('')}

                <div class="now-playing-bar hidden" id="songs-now-playing">
                    <div class="now-playing-thumb" id="snp-thumb"></div>
                    <div class="now-playing-info">
                        <div class="now-playing-title" id="snp-title"></div>
                        <div class="now-playing-status">
                            <div class="now-playing-pulse"></div>
                            Đang phát
                        </div>
                    </div>
                    <button class="now-playing-stop" id="snp-stop" title="Dừng lại">⏹</button>
                </div>
            </div>`;

        container.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click',  () => _playSong(card.dataset.songId));
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    _playSong(card.dataset.songId);
                }
            });
        });

        document.getElementById('snp-stop')?.addEventListener('click', () => {
            FallingNotes.stop();
            _playing = false;
            _activeSongId = null;
            const npBar = document.getElementById('songs-now-playing');
            if (npBar) npBar.classList.add('hidden');
            _closeOverlay();
        });
    }

    function _closeOverlay() {
        document.getElementById('song-play-overlay')?.remove();
    }

    function _playSong(songId) {
        const song = SongsData.getById(songId);
        if (!song) return;

        FallingNotes.stop();
        _playing      = false;
        _activeSongId = songId;

        let overlay = document.getElementById('song-play-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'song-play-overlay';
            overlay.style.cssText =
                'position:fixed;inset:0;z-index:300;background:#0d0d17;' +
                'display:flex;flex-direction:column;animation:fadeIn 0.2s ease';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
                        border-bottom:1px solid rgba(100,160,255,0.1);flex-shrink:0">
                <button id="song-close-btn" style="background:none;border:none;color:#5a7898;
                    font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px;font-family:inherit">
                    ←
                </button>
                <div style="flex:1;min-width:0">
                    <div style="font-size:0.88rem;font-weight:800;color:#e0eaff;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${song.thumbnail} ${song.title}
                    </div>
                    <div style="font-size:0.7rem;color:#4a6888">
                        ${song.artist} · ♩${song.bpm} BPM · ${song.timeSignature}
                    </div>
                </div>
                <button id="song-wait-btn" class="lv-play-mode-btn ${_waitMode ? 'active' : ''}">
                    ⏸ Chờ nốt
                </button>
            </div>

            <div id="song-falling-area"
                style="flex:1;min-height:0;position:relative;background:rgba(0,0,0,0.4)">
                <canvas id="song-falling-canvas"
                    style="position:absolute;inset:0;width:100%;height:100%"></canvas>
            </div>

            <div id="song-piano-keys"
                style="height:220px;flex-shrink:0;display:flex;align-items:center;
                       justify-content:center;overflow:hidden;background:rgba(10,10,20,0.8)">
            </div>

            <div style="display:flex;align-items:center;gap:10px;padding:10px 16px 14px;
                        border-top:1px solid rgba(100,160,255,0.08);flex-shrink:0">
                <button id="song-start-btn" class="lv-btn lv-btn-success" style="flex:1;padding:11px">
                    ▶ Bắt đầu
                </button>
                <button id="song-restart-btn" class="lv-btn lv-btn-secondary" style="padding:11px 20px">
                    ↺ Lại từ đầu
                </button>
            </div>`;

        document.getElementById('song-close-btn')?.addEventListener('click', () => {
            FallingNotes.stop();
            _playing = false;
            overlay.remove();
            const npBar = document.getElementById('songs-now-playing');
            if (npBar) npBar.classList.add('hidden');
        });

        document.getElementById('song-wait-btn')?.addEventListener('click', e => {
            _waitMode = !_waitMode;
            e.currentTarget.classList.toggle('active', _waitMode);
            FallingNotes.setWaitMode(_waitMode);
        });

        // Mount piano
        Visualizer.destroy();
        const { canvas: pianoCanvas, noteMap } = Keyboard.render('song-piano-keys', '61');
        Visualizer.init(pianoCanvas, noteMap);

        // Init falling notes
        const fallingArea   = document.getElementById('song-falling-area');
        const fallingCanvas = document.getElementById('song-falling-canvas');
        if (fallingCanvas && fallingArea) {
            fallingCanvas.width  = fallingArea.clientWidth  || window.innerWidth;
            fallingCanvas.height = fallingArea.clientHeight || 200;
            FallingNotes.init(fallingCanvas, noteMap);
            new ResizeObserver(() => {
                const w = fallingArea.clientWidth  || window.innerWidth;
                const h = fallingArea.clientHeight || 200;
                FallingNotes.resize(w, h);
            }).observe(fallingArea);
        }

        const sequence = SongsData.toSequence(songId);
        FallingNotes.loadSequence(sequence, song.bpm);
        FallingNotes.setWaitMode(_waitMode);

        FallingNotes.onSequenceEnd(() => {
            _playing = false;
            const btn = document.getElementById('song-start-btn');
            if (btn) { btn.textContent = '🎉 Xong! Chơi lại?'; btn.disabled = false; }
        });

        document.getElementById('song-start-btn')?.addEventListener('click', e => {
            if (!_playing) {
                _playing = true;
                e.currentTarget.textContent = '⏸ Đang chơi...';
                e.currentTarget.disabled    = true;
                FallingNotes.start();

                // Show now-playing bar
                const npBar = document.getElementById('songs-now-playing');
                if (npBar) {
                    document.getElementById('snp-thumb').textContent = song.thumbnail;
                    document.getElementById('snp-title').textContent = song.title;
                    npBar.classList.remove('hidden');
                }
            }
        });

        document.getElementById('song-restart-btn')?.addEventListener('click', () => {
            FallingNotes.stop();
            _playing = false;
            FallingNotes.loadSequence(sequence, song.bpm);
            FallingNotes.setWaitMode(_waitMode);
            const btn = document.getElementById('song-start-btn');
            if (btn) { btn.textContent = '▶ Bắt đầu'; btn.disabled = false; }
        });
    }

    return { render };
})();
