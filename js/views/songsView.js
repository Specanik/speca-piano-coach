/**
 * SongsView — Song library + play-along UI.
 * Renders inside the "Songs" practice tab.
 * Uses FallingNotes + InputRouter for real-time play-along.
 */
const SongsView = (() => {
    let _activeSongId = null;
    let _playing      = false;

    function render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const songs = SongsData.getAll();

        const diffLabels  = { beginner: '🟢 Cơ bản', intermediate: '🟡 Trung cấp', advanced: '🔴 Nâng cao' };
        const grouped = {};
        ['beginner', 'intermediate', 'advanced'].forEach(d => {
            grouped[d] = songs.filter(s => s.difficulty === d);
        });

        container.innerHTML = `
            <div style="padding:12px 0">
                <div style="padding:0 14px 10px;font-size:0.8rem;font-weight:700;color:#9ab8d8;
                            letter-spacing:0.08em;text-transform:uppercase">
                    🎵 Thư viện bài nhạc
                </div>
                ${['beginner', 'intermediate', 'advanced'].map(d => `
                    <div style="margin-bottom:12px">
                        <div style="padding:4px 14px 6px;font-size:0.7rem;font-weight:700;color:#4a6888">
                            ${diffLabels[d]}
                        </div>
                        ${grouped[d].map(song => `
                            <div class="song-play-card" data-song-id="${song.id}"
                                style="display:flex;align-items:center;gap:10px;padding:10px 14px;
                                       cursor:pointer;border-bottom:1px solid rgba(100,160,255,0.06);
                                       transition:background 0.15s;">
                                <span style="font-size:1.5rem;flex-shrink:0">${song.thumbnail}</span>
                                <div style="flex:1;min-width:0">
                                    <div style="font-size:0.8rem;font-weight:700;color:#c8e0f0;
                                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                                        ${song.title}
                                    </div>
                                    <div style="font-size:0.68rem;color:#4a6888;margin-top:1px">
                                        ${song.artist} · ${song.bpm} BPM · ${song.timeSignature}
                                    </div>
                                </div>
                                <button class="play-song-btn lv-btn lv-btn-primary"
                                    data-song-id="${song.id}"
                                    style="padding:6px 14px;font-size:0.72rem;flex-shrink:0;border-radius:8px">
                                    ▶ Chơi
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>`;

        container.querySelectorAll('.play-song-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                _playSong(btn.dataset.songId);
            });
        });

        container.querySelectorAll('.song-play-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.background = 'rgba(100,160,255,0.07)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.background = '';
            });
        });
    }

    function _playSong(songId) {
        const song = SongsData.getById(songId);
        if (!song) return;

        FallingNotes.stop();
        _playing      = false;
        _activeSongId = songId;

        // Build overlay
        let overlay = document.getElementById('song-play-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'song-play-overlay';
            overlay.style.cssText = `
                position:fixed;inset:0;z-index:300;background:#0d0d17;
                display:flex;flex-direction:column;animation:fadeIn 0.2s ease
            `;
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;
                        border-bottom:1px solid rgba(100,160,255,0.1);flex-shrink:0">
                <button id="song-close-btn" style="background:none;border:none;color:#5a7898;
                    font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px;font-family:inherit">
                    ←
                </button>
                <div style="flex:1">
                    <div style="font-size:0.88rem;font-weight:800;color:#e0eaff">${song.thumbnail} ${song.title}</div>
                    <div style="font-size:0.7rem;color:#4a6888">${song.artist} · ${song.bpm} BPM</div>
                </div>
                <button id="song-wait-btn" class="lv-play-mode-btn active"
                    style="font-size:0.7rem;padding:5px 10px">⏸ Chờ nốt</button>
            </div>

            <div id="song-falling-area" style="flex:1;min-height:0;position:relative;background:rgba(0,0,0,0.4)">
                <canvas id="song-falling-canvas" style="width:100%;height:100%"></canvas>
            </div>

            <div id="song-piano-mount" style="height:220px;flex-shrink:0;display:flex;
                align-items:center;justify-content:center;overflow:hidden;
                background:rgba(10,10,20,0.8)">
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

        // Wire close
        document.getElementById('song-close-btn')?.addEventListener('click', () => {
            FallingNotes.stop();
            _playing = false;
            overlay.remove();
        });

        // Wait mode toggle
        let waitMode = true;
        document.getElementById('song-wait-btn')?.addEventListener('click', e => {
            waitMode = !waitMode;
            e.currentTarget.classList.toggle('active', waitMode);
            FallingNotes.setWaitMode(waitMode);
        });

        // Mount piano
        const pianoMount = document.getElementById('song-piano-mount');
        if (pianoMount) {
            pianoMount.id = 'song-piano-keys';
            Visualizer.destroy();
            const { canvas, noteMap } = Keyboard.render('song-piano-keys', '61');
            Visualizer.init(canvas, noteMap);

            // Init falling notes canvas
            const fallingArea  = document.getElementById('song-falling-area');
            const fallingCanvas = document.getElementById('song-falling-canvas');
            if (fallingCanvas && fallingArea) {
                fallingCanvas.width  = fallingArea.clientWidth  || window.innerWidth;
                fallingCanvas.height = fallingArea.clientHeight || 200;
                FallingNotes.init(fallingCanvas, noteMap);
            }
        }

        // Load sequence
        const sequence = SongsData.toSequence(songId);
        FallingNotes.loadSequence(sequence, song.bpm);
        FallingNotes.setWaitMode(waitMode);

        FallingNotes.onSequenceEnd(() => {
            _playing = false;
            const btn = document.getElementById('song-start-btn');
            if (btn) { btn.textContent = '🎉 Xong! Chơi lại?'; btn.disabled = false; }
        });

        // Start button
        document.getElementById('song-start-btn')?.addEventListener('click', e => {
            if (!_playing) {
                _playing = true;
                e.currentTarget.textContent = '⏸ Đang chơi...';
                e.currentTarget.disabled = true;
                FallingNotes.start();
            }
        });

        document.getElementById('song-restart-btn')?.addEventListener('click', () => {
            FallingNotes.stop();
            _playing = false;
            FallingNotes.loadSequence(sequence, song.bpm);
            FallingNotes.setWaitMode(waitMode);
            const btn = document.getElementById('song-start-btn');
            if (btn) { btn.textContent = '▶ Bắt đầu'; btn.disabled = false; }
        });
    }

    return { render };
})();
