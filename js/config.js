/**
 * config.js — Single source of truth for all tunable constants.
 * Import via: const C = window.PianoConfig;
 * Every magic number that was previously scattered across modules lives here.
 */
const PianoConfig = Object.freeze({

  // ─── Audio ────────────────────────────────────────────────────────────────
  audio: {
    sampleRate: 44100,
    latencyHint: 'interactive',   // ~5 ms buffer
    prewarmNotes: [60, 64, 67],   // C4 E4 G4 — first chord users touch
    defaultVoice: 'salamander',
    defaultVelocity: 80,          // keyboard (non-MIDI) key velocity
    gainMaster: 0.85,
    releaseTime: 0.4,             // seconds for note-off envelope tail
    sustainGainMultiplier: 0.7,   // held-pedal note gain reduction
  },

  // ─── Falling Notes / Visualizer ──────────────────────────────────────────
  fallingNotes: {
    // Speed is computed dynamically from BPM; this is the FALLBACK when BPM unknown
    fallbackPxPerSec: 200,
    // Canvas fraction that notes travel before hitting the strike zone
    travelFraction: 0.80,
    // Strike-zone height in px
    hitZoneH: 28,
    // How many ms ahead of the beat a note is considered "in window"
    hitWindowMs: 120,
    // Auto-advance tolerance in performance mode (px from bottom)
    perfAutoAdvancePx: 8,
    // Particle burst count on correct hit
    particleCount: 14,
    // Colors (right-hand: blue, left-hand: orange — split at MIDI 60)
    colors: {
      whiteNote:   '#4a9eff',          // right hand white key
      blackNote:   '#7060e0',          // right hand black key
      leftNote:    '#ff8c40',          // left hand white key
      leftBlack:   '#cc5a00',          // left hand black key
      hit:         '#50c878',
      miss:        '#ff5050',
      hitZoneBg:   'rgba(74,158,255,0.10)',
      particle:    '#ffe066',
    },
  },

  // ─── Lesson Engine ────────────────────────────────────────────────────────
  lesson: {
    inputDebounceMs: 50,          // ignore duplicate noteOn within this window
    defaultBpm: 60,
    // Scoring windows
    perfectWindowMs: 80,
    goodWindowMs: 200,
  },

  // ─── Metronome ────────────────────────────────────────────────────────────
  metronome: {
    lookAheadMs: 25,              // scheduler interval
    scheduleAheadSec: 0.1,        // how far ahead to schedule beats
    beatFlashMs: 100,             // visual flash duration
  },

  // ─── UI / Layout ─────────────────────────────────────────────────────────
  ui: {
    viewTransitionMs: 220,        // opacity fade between SPA views
    resizeDebounceMs: 150,        // canvas re-render on window resize
    maxAppWidthPx: 1440,          // caps layout on ultra-wide screens
    mobileBreakpointPx: 640,
    tabletBreakpointPx: 1024,
  },

  // ─── Progress / Gamification ─────────────────────────────────────────────
  progress: {
    xpPerLesson: 50,
    xpPerSong: 30,
    xpPerPerfect: 20,
    streakResetHours: 26,         // grace period before streak resets
  },

});

window.PianoConfig = PianoConfig;
