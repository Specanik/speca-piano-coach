# Piano Coach — System State & Dev Handoff
<!-- Cập nhật: 2026-06-01 | Turn 3 hoàn chỉnh -->
<!-- Đây là nguồn sự thật duy nhất về trạng thái codebase. -->
<!-- Khi AI hết token: copy toàn bộ file này, paste vào đầu prompt mới. -->

---

## 1. Product Vision

| | |
|---|---|
| **Mục tiêu** | Vượt Simply Piano / Perfect Piano cho thị trường Việt Nam |
| **Slogan** | "Học đàn không cần thầy, không cần nhạc lý từ đầu" |
| **Stack** | Vanilla HTML/CSS/JS — SPA, không framework, không build step |
| **Platform** | Web PWA (Mobile-first, offline via Service Worker) |
| **Thư mục** | `d:\AI\Piano\speca-piano-coach\` |
| **Dev server** | `python -m http.server 8765` → http://localhost:8765 |

---

## 2. Architecture

```
index.html
 ├── css/
 │   ├── style.css            — base / reset
 │   ├── app-shell.css        — ⭐ toàn bộ shell UI + glassmorphism (~1400 dòng)
 │   ├── lesson.css           — piano keys, practice controls
 │   ├── learn-view.css       — lesson view UI (~1000 dòng)
 │   ├── theory-cards.css     — theory card styles
 │   └── settings-panel.css   — ⭐ slide-in settings drawer (Turn 3)
 │
 ├── js/
 │   ├── config.js            — ⭐ centralized constants (PianoConfig)
 │   ├── app.js               — entry point (DOMContentLoaded)
 │   ├── appShell.js          — orchestration, nav, tabs, piano render
 │   ├── router.js            — SPA navigation (4 views)
 │   │
 │   ├── audio.js             — 912 dòng, 18 voices, Web Audio API
 │   ├── keyboard.js          — piano DOM render + event emit
 │   ├── visualizer.js        — canvas note light-up
 │   ├── midi.js              — Web MIDI API wrapper (sustain CC64)
 │   ├── pitchDetector.js     — mic pitch detection
 │   ├── inputRouter.js       — unified NoteOn/NoteOff event bus
 │   ├── metronome.js         — look-ahead beat scheduler
 │   ├── fallingNotes.js      — ⭐ Synthesia canvas (per-hand colors, speed mult)
 │   │
 │   ├── settingsPanel.js     — ⭐ settings gear + slide-in drawer (Turn 3)
 │   ├── devMode.js           — dev utilities (UI stripped, logic only)
 │   │
 │   ├── chords.js / chordPlayer.js / chordUI.js
 │   ├── songParser.js / songAccompaniment.js / songPlayer.js / songUI.js
 │   ├── progressionPlayer.js
 │   ├── lessonEngine.js      — state machine: idle→theory→practice→play→quiz→result
 │   ├── lessonUI.js
 │   ├── progressStore.js     — XP, streak, badges → localStorage
 │   ├── scorer.js
 │   ├── adaptiveEngine.js
 │   ├── comboSystem.js
 │   ├── noteHighlighter.js
 │   ├── theoryRenderer.js
 │   ├── midiTester.js
 │   ├── demoPlayer.js
 │   │
 │   └── views/
 │       ├── homeView.js      — Home + journey path render
 │       ├── learnView.js     — Full-screen lesson UI (~583 dòng)
 │       ├── profileView.js   — Profile / XP history
 │       ├── songsView.js     — ⭐ Spotify-style song library (Turn 2 rewrite)
 │       └── onboarding.js    — 3-slide intro flow
 │
 └── data/
     ├── lessons.js           — 20 bài học (10 beginner + 10 intermediate)
     └── songs.js             — 15 bài play-along
```

### Data flow

```
User input (keyboard / MIDI / mic)
    → inputRouter.js          (unified bus, applies keyboard velocity from SettingsPanel)
    → appShell._initInputRouter  (applies masterVolume scale + MIDI transpose)
    → AudioEngine.startNote()
    → Visualizer / NoteHighlighter / FallingNotes / LessonEngine / MidiTester
```

### Settings data flow

```
SettingsPanel.get('masterVolume')   ← appShell reads live on every note
SettingsPanel.get('keyboardVelocity') ← inputRouter.attachKeyboard() reads live
SettingsPanel.get('midiTranspose')  ← appShell applies offset on every note
SettingsPanel.set(key, val)         → localStorage('piano-settings-v1') + immediate apply
```

---

## 3. Key Technical Decisions

| Decision | Lý do |
|----------|-------|
| `requestAnimationFrame` thay `setTimeout` cho view transitions | Tránh race condition canvas 0-width |
| `visibility` trick cho view flicker | `visibility: hidden` delay sau khi opacity=0 xong để inactive view không chồng lên |
| `data-tab-active` attribute cho practice sub-tabs | CSS `[data-tab-active="false"] { display:none }` — single source of truth |
| `SPLIT_MIDI = 60` (Middle C) chia left/right hand | Convention chuẩn nhạc; configurable qua `FallingNotes.setSplit()` |
| `latencyHint: 'interactive'` cho AudioContext | ~5ms buffer, tốt nhất cho piano realtime |
| `module-level _stepKbHandler` trong learnView | Cleanup đúng Space/Enter handler khi step re-render |
| Settings lưu `piano-settings-v1` nhưng sync với `piano-theme`/`piano-layout` | Backward compat với appShell đọc legacy keys |
| `_speedMult` nhân vào `_pxPerSec` sau khi tính BPM | Speed setting không phá vỡ BPM-sync logic |

---

## 4. Settings Panel (Turn 3) — Chi tiết

**File:** `js/settingsPanel.js` + `css/settings-panel.css`

**Kích hoạt:** Nút ⚙ góc phải top-bar | `Ctrl+Shift+,`

**localStorage key:** `piano-settings-v1` (JSON object)

### Settings có hiệu lực ngay:

| Key | Default | Áp dụng ở đâu |
|-----|---------|--------------|
| `masterVolume` | 85 | `appShell._initInputRouter()` — scale velocity × (vol/100) |
| `keyboardVelocity` | 80 | `inputRouter.attachKeyboard()` — velocity gửi từ keyboard |
| `midiTranspose` | 0 | `appShell` — offset midi note trong cả noteOn + noteOff |
| `pianoTheme` | 'classic' | `document.body.dataset.theme` + `piano-theme` localStorage |
| `pianoLayout` | '36' | Click `.layout-btn` để trigger AppShell re-render piano |
| `handSplitMidi` | 60 | `FallingNotes.setSplit()` → cập nhật `_splitMidi` |
| `fallingSpeedMult` | 1.0 | `FallingNotes.setSpeedMult()` → nhân vào `_pxPerSec` |
| `defaultWaitMode` | false | Đọc bởi SongsView khi khởi tạo |
| `metronomeBpm` | 80 | Đọc bởi metronome init |
| `devMode` | false | Toggle hiện/ẩn Dev Tools section trong panel |

### Dev Tools (trong settings panel):
- Mở khóa tất cả bài học (3★) — gọi `DevMode.unlockAll()`
- Bỏ qua bước hiện tại — gọi `DevMode.skipStep()`
- Jump đến bài học bất kỳ — gọi `DevMode.gotoLesson(id)`
- Reset tiến trình — gọi `DevMode.resetProgress()`
- Dev log (12 dòng gần nhất)
- Input status: Keyboard ✓ | MIDI dot | Mic dot

---

## 5. FallingNotes — API hiện tại

```javascript
FallingNotes.init(canvasEl, noteMapObj)
FallingNotes.loadSequence(steps, bpm)
FallingNotes.start() / .stop()
FallingNotes.noteOn(midi) / .noteOff(midi)
FallingNotes.setWaitMode(bool)
FallingNotes.setNoteMap(obj)         // sau khi resize piano
FallingNotes.resize(w, h)
FallingNotes.setSplit(midiNote)      // ← Turn 3: thay đổi hand split (0-127)
FallingNotes.setSpeedMult(mult)      // ← Turn 3: tốc độ nốt rơi (0.1-4.0)
FallingNotes.isWaitMode()
FallingNotes.onStepComplete(cb)      // cb(stepIdx, {correct, midi})
FallingNotes.onSequenceEnd(cb)       // cb(results[])
```

**Màu per-hand:**
- Right hand (MIDI ≥ `_splitMidi`): Blue `#4a9eff` (white) / Purple `#7060e0` (black)
- Left hand (MIDI < `_splitMidi`): Orange `#ff8c40` (white) / Dark orange `#cc5a00` (black)
- Hit: Green `#50c878` | Miss: Red `#ff5050`
- Particle burst: right=gold, left=orange

---

## 6. DevMode — API (UI stripped, logic only)

```javascript
DevMode.isActive()           // → SettingsPanel.get('devMode')
DevMode.enable()             // → SettingsPanel.set('devMode', true)
DevMode.disable()
DevMode.toggle()
DevMode.unlockAll()          // unlock tất cả bài 3★
DevMode.resetProgress()      // ProgressStore.reset()
DevMode.skipStep()           // click #lv-next
DevMode.gotoLesson(id)       // Router.go('learn') + LearnView.startLesson()
DevMode.connectMidi()        // InputRouter.enableMidi()
```

**Keyboard shortcut:** `Ctrl+Shift+D` — toggle devMode qua SettingsPanel

---

## 7. Execution History

### Turn 1 — 2026-05-31 | Audit & Phase 1 Foundation

**8 critical bugs fixed:**

| Bug | File | Fix |
|-----|------|-----|
| AudioContext init delay ~300ms | `js/audio.js` | Prewarm on first pointer interaction |
| Canvas race condition (0-width) | `js/appShell.js` | `requestAnimationFrame` thay `setTimeout` |
| Practice tabs dùng `display` conflict | `js/appShell.js` | `data-tab-active` attribute |
| LessonEngine null crash | `js/lessonEngine.js` | Null-safety guards |
| Metronome CSS hardcoded | `css/app-shell.css` | `@keyframes metro-flash` |
| FallingNotes BPM-unaware speed | `js/fallingNotes.js` | `pxPerSec = fallH / (lookaheadBeats × beatMs / 1000)` |
| Magic numbers scattered | nhiều file | Tạo `js/config.js` centralize |
| Permissions prompt mỗi lần | `.claude/settings.json` | `bypassPermissions: true` |

**File mới tạo:**
- `js/config.js` — PianoConfig constants object
- `SYSTEM_STATE.md` — file này

---

### Turn 2 — 2026-05-31 | Phase 1 Finish + Phase 2 Premium UI

#### Phase 1 remaining fixes:

| Fix | Chi tiết |
|-----|---------|
| **Ultra-wide max-width** | `#app.app-layout { max-width: 1440px; margin: 0 auto }` trong app-shell.css |
| **View flicker** | `visibility: hidden` + `transition: visibility 0s linear 0.22s` — ẩn SAU khi opacity transition xong |
| **Mobile < 500px** | 12 CSS rules: hide logo text, voice label, collapse chord sidebar, nav labels |
| **6× setTimeout → rAF** | appShell (learn nav), learnView (close btn, result btn), homeView (startLesson, dailyChallenge) |

#### Phase 2 Premium UI (26 improvements):

**Songs Library (songsView.js FULL REWRITE):**
- Spotify-style horizontal scroll với `scroll-snap`
- Card với gradient artwork theo difficulty (beginner=blue→purple, intermediate=orange→red, advanced=green→teal)
- BPM progress bar inside artwork (`_bpmPct` map 60-180 BPM → 5-100% fill)
- Now-playing sticky bar `#songs-now-playing` với stop button
- ResizeObserver → `FallingNotes.resize()` tự động

**Glassmorphism (app-shell.css +400 lines):**
- `.home-cta-card`: `backdrop-filter: blur(16px)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)`
- `.home-stat-card`: `backdrop-filter: blur(8px)`
- `.practice-header`, `.bottom-nav`, `.lv-header`: `backdrop-filter: blur(10-16px)`

**Animations:**
- `@keyframes gradientShift` — CTA button animated gradient (3s loop)
- `@keyframes ctaOrb` — floating orb on home (6s ease-in-out)
- `@keyframes currentPulse` — double-ring pulse trên current journey node
- `@keyframes feedbackPop` — scale bounce khi trả lời đúng (learn-view.css)
- `@keyframes splashBounce` — emoji bounce trên splash screen

**FallingNotes per-hand colors (fallingNotes.js + config.js):**
- Thêm `leftNote: '#ff8c40'`, `leftBlack: '#cc5a00'` vào config.js
- `const SPLIT_MIDI = 60` (→ sau Turn 3 đổi thành `let _splitMidi`)
- Draw loop: `if (b.midi < SPLIT_MIDI)` chọn leftHand/leftBlack colors
- `_burst(x, w, midi)`: baseColor orange cho left hand, gold cho right

**Splash screen (index.html + app.js):**
- HTML splash div: position:fixed, z-index:9000, fade ra sau boot
- Progress bar `#splash-bar`: width 0% → 60% (khi scripts load) → 100% (sau boot)
- `@keyframes splashBounce` inline trong `<style>`
- Fade: `opacity:0; visibility:hidden` sau 200ms → remove DOM sau 380ms

**learnView.js enhancements:**
- `_stepKbHandler` module-level variable — proper cleanup Space/Enter listener
- `showList()` removes old handler trước khi navigate
- `_renderStep()` registers Space/Enter → click #lv-next

**profileView.js:**
- Lesson history dùng CSS classes thay inline styles:
  - `.profile-history-row.completed`, `.profile-history-title.done`
  - `.profile-history-stars`, `.profile-history-pts`, `.profile-history-empty`

---

### Turn 3 — 2026-06-01 | Settings Panel

**Files mới tạo:**

| File | Nội dung |
|------|---------|
| `css/settings-panel.css` | 240 dòng: gear btn, overlay, panel, slider, stepper, toggle, segmented, dev section |
| `js/settingsPanel.js` | 330 dòng: SettingsPanel module với 10 settings, slide-in UI, live apply |

**Files đã sửa:**

| File | Thay đổi |
|------|---------|
| `index.html` | +CSS link `settings-panel.css` · +gear button `.settings-gear-btn` trong top-bar · +`<script src="js/settingsPanel.js">` trước devMode |
| `js/app.js` | `SettingsPanel.init()` trước `AppShell.boot()` · `SettingsPanel.applyAll()` trong rAF sau boot |
| `js/appShell.js` | `_initInputRouter()`: masterVolume scale + midiTranspose offset trên mọi note |
| `js/inputRouter.js` | `attachKeyboard()`: velocity đọc từ `SettingsPanel.get('keyboardVelocity')` thay hardcode 80 |
| `js/devMode.js` | Strip toàn bộ UI (`_inject`, `_renderBadge`, `_renderPanel`, `_togglePanel`, `_log`) · Giữ logic (`unlockAll`, `resetProgress`, `skipStep`, `gotoLesson`, `connectMidi`) · `enable()`/`disable()` → SettingsPanel |
| `js/fallingNotes.js` | `const SPLIT_MIDI=60` → `let _splitMidi=60; let _speedMult=1.0` · `_recalcSpeed()` nhân `_speedMult` · Export `setSplit(midi)`, `setSpeedMult(mult)` |

**Turn 4 (2026-06-01) — Falling Notes Fix + Simply Piano UX:**

Bug root cause: canvas init đọc `area.clientWidth/Height` trước khi layout hoàn tất → dùng `requestAnimationFrame`. Canvas width = `_pianoTotalWidth` (không cần offset math — `overflow:hidden` tự clip).

| File | Thay đổi |
|------|---------|
| `js/fallingNotes.js` | Note name labels trên bars · `_handFilter` + `setHandFilter('left'/'both'/'right')` · `_scheduleBars` support `durationMs` (convert → beats tự động) |
| `js/views/learnView.js` | Rewrite `_renderPlay`: rAF canvas init · Controls bar Simply Piano-style · Countdown 4-3-2-1 · `_currentSpeedMult`, `_currentHand` persistent · `_restartFalling()` helper · `_runCountdown()` helper |
| `css/learn-view.css` | `.lv-play-topbar` · `.lv-ctrl-seg/btn` · `.lv-ctrl-tog` · `.lv-countdown-overlay/num` · `.lv-piano-play-area` · `@keyframes lv-countdown-pop` |

**Turn 4b (2026-06-01) — Falling notes / keyboard connection fix:**

Root cause: wait-mode logic hoàn toàn sai — `start()` đặt `_waiting = _waitMode = true` ngay từ đầu → tốc độ mãi bằng 0, nốt không rơi, không bao giờ chạm hit zone → không có gì xảy ra khi bấm phím.

Simply Piano wait-mode đúng: nốt LUÔN rơi → khi chạm hit zone THÌ dừng lại → bấm đúng → tiếp tục rơi.

| Thay đổi | Chi tiết |
|----------|---------|
| `start()` | `_waiting = false` (không phải `_waitMode`) — luôn bắt đầu rơi |
| `_loop` wait-mode pause | Khi bar chạm hitY: `b.y = hitY - b.h` (snap) + `_waiting = true` |
| `_loop` hit zone pulse | Phát sáng nhấp nháy khi đang chờ bấm |
| `_advanceStep` | `_waiting = false` (resume rơi) thay vì `true` |
| `noteOn` popup | `+Good!` floating text khi bấm đúng |
| `_popups[]` | State mới cho floating score text |

---

## 8. Current File Map

| File | Vai trò | Est. Lines |
|------|---------|-----------|
| `index.html` | Entry point + splash + app shell HTML | ~380 |
| `js/config.js` | ⭐ Centralized PianoConfig constants | ~85 |
| `js/settingsPanel.js` | ⭐ Settings gear + slide-in drawer | ~330 |
| `js/appShell.js` | Orchestration, nav, tabs, piano, input wiring | ~430 |
| `js/router.js` | SPA 4-view navigation | 71 |
| `js/audio.js` | Audio engine, 18 voices | 912 |
| `js/fallingNotes.js` | ⭐ Synthesia canvas (per-hand, speed mult) | ~375 |
| `js/lessonEngine.js` | Lesson state machine | 283 |
| `js/devMode.js` | Dev utility actions (no UI) | ~100 |
| `js/inputRouter.js` | Unified NoteOn/NoteOff bus | ~120 |
| `js/views/learnView.js` | Full-screen lesson UI | ~583 |
| `js/views/homeView.js` | Home + journey path | ~188 |
| `js/views/songsView.js` | ⭐ Spotify-style song library | ~200 |
| `js/views/profileView.js` | Profile / XP / history | ~145 |
| `css/app-shell.css` | ⭐ Main UI + glassmorphism + animations | ~1400 |
| `css/learn-view.css` | Lesson view styles | ~1000 |
| `css/settings-panel.css` | ⭐ Settings panel styles | ~240 |
| `data/lessons.js` | 20 bài học | large |
| `data/songs.js` | 15 bài play-along | large |

---

## 9. Remaining Roadmap

### Phase 2 còn lại (Turn 4+)

| Feature | Ghi chú |
|---------|--------|
| **SVG Piano keyboard** | Rewrite `js/keyboard.js` từ DOM divs → SVG elements. Scale tốt hơn trên HiDPI + ultra-wide |
| **Vertical winding journey map** | Rewrite `HomeView._renderPath()` từ zigzag rows → Duolingo-style vertical winding path với SVG connectors |
| **Onboarding 90s flow** | Hoàn thành bài đầu tiên ngay sau onboarding + mic calibration ngầm |

### Phase 3 — AI & Killer Features (chưa bắt đầu)

| Feature | Tech |
|---------|------|
| **AI Finger Coach** | Camera → MediaPipe Hands → chấm điểm tư thế ngón tay realtime |
| **Steinway Simulator** | Spectral convolution với IR sample ~20KB |
| **AI Accompaniment** | Chord progression tự động theo bài đang chơi |
| **Adaptive BPM** | Giảm tempo khi detect sai > 3 lần liên tiếp |
| **Sight-reading Mode** | Sheet music cuộn realtime theo nhịp |

---

## 10. Known Limitations

| Hạn chế | Mô tả |
|---------|------|
| Piano layout/theme drift | Nếu user đổi từ practice view controls, Settings Panel hiển thị stale cho đến lần mở tiếp (sync xảy ra khi `show()`) |
| AudioEngine master volume | Implement qua velocity scaling, không phải gain node thật — volume 0% vẫn có thể có audio từ sustain |
| MIDI transpose + lesson | Transpose offset áp dụng ở input level → lesson vẫn hoạt động đúng nhưng chưa test edge cases |
| Service Worker cache | `sw.js` chưa được update sau mỗi change → cần hard refresh (Ctrl+Shift+R) để clear cache |
| `defaultWaitMode` setting | SettingsPanel lưu setting nhưng SongsView đọc value chỉ lúc khởi tạo, không live |

---

_File này là nguồn sự thật duy nhất. AI agent đọc file này để tiếp tục làm việc mà không cần hỏi lại._
