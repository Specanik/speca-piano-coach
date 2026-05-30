/**
 * MidiTester — MIDI device tester panel.
 * Inspired by controllertest.io/midi-tester/
 *
 * Features:
 *   • Live device list with connection status
 *   • Real-time note display (note name, MIDI number, velocity)
 *   • Visual keyboard with pressed keys highlighted
 *   • Message log (last 20 messages)
 *   • Velocity bar per note
 *   • Channel display
 *
 * Renders into a container element.
 * Also listens to InputRouter for note events.
 */
const MidiTester = (() => {
    let _container = null;
    let _active    = new Map();  // midi → { velocity, time }
    let _log       = [];         // last 20 events
    let _noteMap   = {};         // from keyboard rendering

    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    function midiToName(midi) {
        return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
    }

    // ── Render ────────────────────────────────────────────────────
    function render(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        _container = el;

        el.innerHTML = `
            <div style="padding:12px;display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;overflow-y:auto">

                <!-- Device status -->
                <div style="background:rgba(100,160,255,0.06);border:1px solid rgba(100,160,255,0.12);border-radius:10px;padding:12px">
                    <div style="font-size:0.72rem;font-weight:700;color:#7ab8ff;text-transform:uppercase;
                                letter-spacing:0.08em;margin-bottom:8px">🎛️ Thiết bị MIDI</div>
                    <div id="midi-device-list">
                        <div style="font-size:0.78rem;color:#4a6888;font-style:italic">
                            Chưa có thiết bị — nhấn nút MIDI ở trên để kết nối
                        </div>
                    </div>
                    <button id="midi-connect-btn" class="lv-btn lv-btn-secondary"
                        style="margin-top:10px;font-size:0.72rem;padding:7px 14px">
                        🔌 Kết nối MIDI
                    </button>
                </div>

                <!-- Live note display -->
                <div style="background:rgba(100,160,255,0.04);border:1px solid rgba(100,160,255,0.1);border-radius:10px;padding:12px">
                    <div style="font-size:0.72rem;font-weight:700;color:#7ab8ff;text-transform:uppercase;
                                letter-spacing:0.08em;margin-bottom:8px">🎹 Nốt đang nhấn</div>
                    <div id="midi-active-notes" style="display:flex;flex-wrap:wrap;gap:6px;min-height:34px">
                        <div style="font-size:0.78rem;color:#3a5878;font-style:italic;align-self:center">
                            Chưa có nốt nào
                        </div>
                    </div>
                </div>

                <!-- Mini keyboard visual -->
                <div style="background:rgba(10,10,20,0.6);border:1px solid rgba(100,160,255,0.1);border-radius:10px;padding:12px">
                    <div style="font-size:0.72rem;font-weight:700;color:#7ab8ff;text-transform:uppercase;
                                letter-spacing:0.08em;margin-bottom:8px">🎼 Bàn phím trực quan</div>
                    <div id="midi-tester-keyboard" style="overflow-x:auto;padding:4px 0"></div>
                </div>

                <!-- Message log -->
                <div style="background:rgba(100,160,255,0.04);border:1px solid rgba(100,160,255,0.1);border-radius:10px;padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <div style="font-size:0.72rem;font-weight:700;color:#7ab8ff;text-transform:uppercase;letter-spacing:0.08em">
                            📋 Lịch sử MIDI
                        </div>
                        <button id="midi-clear-log" style="background:none;border:none;color:#3a5878;
                            font-size:0.7rem;cursor:pointer;font-family:inherit">Xóa</button>
                    </div>
                    <div id="midi-log" style="font-family:monospace;font-size:0.7rem;color:#4a7898;
                        max-height:140px;overflow-y:auto;line-height:1.6">
                        <div style="color:#2a4060;font-style:italic">Chờ tín hiệu MIDI...</div>
                    </div>
                </div>

                <!-- Velocity visualization -->
                <div style="background:rgba(100,160,255,0.04);border:1px solid rgba(100,160,255,0.1);border-radius:10px;padding:12px">
                    <div style="font-size:0.72rem;font-weight:700;color:#7ab8ff;text-transform:uppercase;
                                letter-spacing:0.08em;margin-bottom:10px">⚡ Velocity (lực nhấn)</div>
                    <div id="midi-velocity-bars" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:6px"></div>
                    <div style="font-size:0.66rem;color:#2a4060;margin-top:8px">
                        Velocity 0-127: nhẹ → mạnh (cảm xúc trong nhạc)
                    </div>
                </div>

            </div>`;

        // Build mini keyboard
        _buildMiniKeyboard();

        // Connect button
        document.getElementById('midi-connect-btn')?.addEventListener('click', async () => {
            const ok = await InputRouter.enableMidi();
            if (ok) {
                _updateDeviceList();
                document.getElementById('midi-connect-btn').textContent = '✅ Đã kết nối';
            } else {
                alert('Không thể kết nối MIDI. Kiểm tra thiết bị và quyền truy cập.');
            }
        });

        document.getElementById('midi-clear-log')?.addEventListener('click', () => {
            _log = [];
            _updateLog();
        });

        // Subscribe to InputRouter status changes
        InputRouter.onStateChange(state => _updateDeviceList(state));
    }

    function _buildMiniKeyboard() {
        const el = document.getElementById('midi-tester-keyboard');
        if (!el) return;

        // Show C3–B5 (3 octaves)
        const startMidi = 48, endMidi = 83;
        const NOTE_IS_BLACK = [false,true,false,true,false,false,true,false,true,false,true,false];

        let html = `<div style="display:flex;align-items:flex-end;position:relative;height:60px">`;

        let wIdx = -1;
        for (let m = startMidi; m <= endMidi; m++) {
            const isBlack = NOTE_IS_BLACK[m % 12];
            if (!isBlack) {
                wIdx++;
                const name  = NOTE_NAMES[m % 12];
                const octave = Math.floor(m / 12) - 1;
                html += `<div class="midi-test-key-w" data-midi="${m}"
                    style="position:relative;width:16px;height:50px;background:#f5f0ec;border:1px solid #aaa;
                    border-radius:0 0 3px 3px;flex-shrink:0;cursor:pointer;z-index:1;
                    display:flex;align-items:flex-end;justify-content:center;padding-bottom:2px;
                    font-size:0.4rem;color:#aaa;font-weight:700;transition:background 0.05s">
                    ${name === 'C' ? octave : ''}
                </div>`;
            } else {
                html += `<div class="midi-test-key-b" data-midi="${m}"
                    style="width:10px;height:30px;background:#111;border-radius:0 0 2px 2px;
                    margin:0 -5px;z-index:2;position:relative;cursor:pointer;flex-shrink:0;
                    transition:background 0.05s"></div>`;
            }
        }

        html += '</div>';
        el.innerHTML = html;

        // Click to play
        el.querySelectorAll('[data-midi]').forEach(key => {
            key.addEventListener('click', () => {
                const midi = parseInt(key.dataset.midi);
                const id   = `test_${midi}_${Date.now()}`;
                AudioEngine.startNote(id, midi);
                setTimeout(() => AudioEngine.stopNote(id), 600);
                _noteOn(midi, 100, 0);
                setTimeout(() => _noteOff(midi), 700);
            });
        });
    }

    function _highlightKey(midi, on) {
        const key = document.querySelector(`#midi-tester-keyboard [data-midi="${midi}"]`);
        if (!key) return;
        const isBlack = [1,3,6,8,10].includes(midi % 12);
        if (on) {
            key.style.background = isBlack ? '#cc5500' : '#ffd700';
            key.style.boxShadow  = `0 0 6px ${isBlack ? '#ff8800' : '#ffcc00'}`;
        } else {
            key.style.background = isBlack ? '#111' : '#f5f0ec';
            key.style.boxShadow  = '';
        }
    }

    function _updateActiveNotes() {
        const el = document.getElementById('midi-active-notes');
        if (!el) return;

        if (_active.size === 0) {
            el.innerHTML = '<div style="font-size:0.78rem;color:#3a5878;font-style:italic;align-self:center">Chưa có nốt nào</div>';
            return;
        }

        el.innerHTML = [..._active.entries()].map(([midi, data]) => {
            const name = midiToName(midi);
            const vel  = data.velocity || 64;
            return `
                <div style="display:flex;flex-direction:column;align-items:center;gap:2px;
                    background:rgba(74,158,255,0.15);border:1px solid rgba(74,158,255,0.3);
                    border-radius:8px;padding:5px 10px;min-width:44px">
                    <div style="font-size:0.88rem;font-weight:800;color:#4a9eff">${name}</div>
                    <div style="font-size:0.62rem;color:#4a6888">midi ${midi}</div>
                    <div style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:2px">
                        <div style="width:${Math.round(vel/127*100)}%;height:100%;background:#4a9eff;border-radius:2px"></div>
                    </div>
                    <div style="font-size:0.58rem;color:#3a5878">v${vel}</div>
                </div>`;
        }).join('');
    }

    function _updateLog() {
        const el = document.getElementById('midi-log');
        if (!el) return;
        if (_log.length === 0) {
            el.innerHTML = '<div style="color:#2a4060;font-style:italic">Chờ tín hiệu MIDI...</div>';
            return;
        }
        el.innerHTML = _log.slice().reverse().map(entry => {
            const color = entry.type === 'on' ? '#4a9eff' : '#ff5050';
            const time  = new Date(entry.time).toLocaleTimeString('vi-VN', { hour12: false });
            return `<div style="color:${color}">
                [${time}] ${entry.type === 'on' ? '▼ NOTE ON' : '▲ NOTE OFF'}
                ${midiToName(entry.midi)} (${entry.midi}) vel:${entry.velocity || 0}
            </div>`;
        }).join('');
    }

    function _updateDeviceList(state) {
        const el = document.getElementById('midi-device-list');
        if (!el) return;
        const devices = InputRouter.getState().midiDevices;
        if (!devices || devices.length === 0) {
            el.innerHTML = '<div style="font-size:0.78rem;color:#4a6888;font-style:italic">Chưa có thiết bị</div>';
        } else {
            el.innerHTML = devices.map(d => `
                <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;color:#90d8b0;margin-bottom:4px">
                    <span style="width:6px;height:6px;border-radius:50%;background:#50c878;flex-shrink:0"></span>
                    ${d.name}
                </div>`).join('');
        }
    }

    function _updateVelocityBars() {
        const el = document.getElementById('midi-velocity-bars');
        if (!el || _active.size === 0) { el && (el.innerHTML = ''); return; }

        el.innerHTML = [..._active.entries()].map(([midi, data]) => {
            const vel = data.velocity || 64;
            const pct = Math.round(vel / 127 * 100);
            const hue = Math.round(vel / 127 * 120); // green=soft, yellow=medium, red=hard
            return `
                <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
                    <div style="width:100%;height:${Math.max(6, pct * 0.5)}px;max-height:50px;
                        background:hsl(${hue},70%,50%);border-radius:3px;
                        transition:height 0.1s;"></div>
                    <div style="font-size:0.58rem;color:#5a7898">${midiToName(midi)}</div>
                    <div style="font-size:0.58rem;color:#3a5878">${vel}</div>
                </div>`;
        }).join('');
    }

    // ── Public event handlers (called from AppShell) ───────────────
    function noteOn(midi, velocity = 64, channel = 0) {
        _active.set(midi, { velocity, channel, time: Date.now() });
        _log.push({ type: 'on', midi, velocity, channel, time: Date.now() });
        if (_log.length > 20) _log.shift();

        _highlightKey(midi, true);
        _updateActiveNotes();
        _updateLog();
        _updateVelocityBars();
    }

    function noteOff(midi) {
        const data = _active.get(midi);
        if (data) {
            _log.push({ type: 'off', midi, velocity: 0, time: Date.now() });
            if (_log.length > 20) _log.shift();
        }
        _active.delete(midi);
        _highlightKey(midi, false);
        _updateActiveNotes();
        _updateLog();
        _updateVelocityBars();
    }

    return { render, noteOn, noteOff };
})();
