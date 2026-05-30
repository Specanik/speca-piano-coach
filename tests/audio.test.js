import { describe, it, expect } from 'vitest'

// Pure math — midiToFreq is private inside AudioEngine IIFE.
// We test the formula directly since it's standard and unchanging.
function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

describe('midiToFreq — MIDI to frequency conversion', () => {
  it('A4 (midi 69) = 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5)
  })

  it('C4 (midi 60) ≈ 261.63 Hz', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1)
  })

  it('A5 (midi 81) = 880 Hz', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 5)
  })

  it('C5 (midi 72) ≈ 523.25 Hz', () => {
    expect(midiToFreq(72)).toBeCloseTo(523.25, 1)
  })

  it('each octave doubles frequency', () => {
    const freqC4 = midiToFreq(60)
    const freqC5 = midiToFreq(72)
    expect(freqC5 / freqC4).toBeCloseTo(2, 10)
  })

  it('A0 (midi 21) ≈ 27.5 Hz', () => {
    expect(midiToFreq(21)).toBeCloseTo(27.5, 1)
  })

  it('C8 (midi 108) ≈ 4186 Hz', () => {
    expect(midiToFreq(108)).toBeCloseTo(4186, 0)
  })
})
