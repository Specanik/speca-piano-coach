import { describe, it, expect } from 'vitest'
import { loadIife } from './helpers/evalIife.js'

const Scorer = loadIife('js/scorer.js', 'Scorer')

describe('Scorer — scoreAttempt', () => {
  it('perfect note match + no timing = 100', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60, 64, 67],
      playedMidi: [60, 64, 67],
    })
    expect(r.score).toBe(100)
    expect(r.stars).toBe(3)
    expect(r.missingNotes).toHaveLength(0)
    expect(r.extraNotes).toHaveLength(0)
  })

  it('all notes missing = score 0', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60, 64, 67],
      playedMidi: [],
    })
    expect(r.score).toBe(0)
    expect(r.noteAccuracy).toBe(0)
  })

  it('partial match (2/3 notes) scores ~47 note accuracy', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60, 64, 67],
      playedMidi: [60, 64],
    })
    expect(r.noteAccuracy).toBeGreaterThan(0)
    expect(r.noteAccuracy).toBeLessThan(100)
    expect(r.missingNotes).toEqual([67])
  })

  it('extra note incurs penalty', () => {
    const perfect = Scorer.scoreAttempt({ targetMidi: [60, 64, 67], playedMidi: [60, 64, 67] })
    const withExtra = Scorer.scoreAttempt({ targetMidi: [60, 64, 67], playedMidi: [60, 64, 67, 70] })
    expect(withExtra.score).toBeLessThan(perfect.score)
    expect(withExtra.extraNotes).toContain(70)
  })

  it('perfect timing (0ms delta) = timingScore 100', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60],
      playedMidi: [60],
      idealTimeMs: 1000,
      actualTimeMs: 1000,
      windowMs: 800
    })
    expect(r.timingScore).toBe(100)
  })

  it('late by half window = timingScore 0', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60],
      playedMidi: [60],
      idealTimeMs: 0,
      actualTimeMs: 400,
      windowMs: 800
    })
    expect(r.timingScore).toBe(0)
  })

  it('slight timing error scores between 50-99', () => {
    const r = Scorer.scoreAttempt({
      targetMidi: [60],
      playedMidi: [60],
      idealTimeMs: 0,
      actualTimeMs: 100,
      windowMs: 800
    })
    expect(r.timingScore).toBeGreaterThan(50)
    expect(r.timingScore).toBeLessThan(100)
  })
})

describe('Scorer — starsFromScore', () => {
  it('90+ = 3 stars', () => { expect(Scorer.starsFromScore(90)).toBe(3) })
  it('89  = 2 stars', () => { expect(Scorer.starsFromScore(89)).toBe(2) })
  it('65  = 2 stars', () => { expect(Scorer.starsFromScore(65)).toBe(2) })
  it('64  = 1 star',  () => { expect(Scorer.starsFromScore(64)).toBe(1) })
  it('0   = 1 star',  () => { expect(Scorer.starsFromScore(0)).toBe(1)  })
})

describe('Scorer — scoreSummary', () => {
  it('empty attempts returns 0 score', () => {
    const s = Scorer.scoreSummary([])
    expect(s.totalScore).toBe(0)
    expect(s.stars).toBe(0)
  })

  it('average of 100s = 100', () => {
    const attempts = [
      { score: 100, noteAccuracy: 100, timingScore: 100 },
      { score: 100, noteAccuracy: 100, timingScore: 100 },
    ]
    const s = Scorer.scoreSummary(attempts)
    expect(s.totalScore).toBe(100)
    expect(s.stars).toBe(3)
  })

  it('computes average correctly for mixed scores', () => {
    const attempts = [
      { score: 80, noteAccuracy: 80, timingScore: 80 },
      { score: 60, noteAccuracy: 60, timingScore: 60 },
    ]
    const s = Scorer.scoreSummary(attempts)
    expect(s.totalScore).toBe(70)
  })
})

describe('Scorer — gradeLabel', () => {
  it('95+ = Xuất sắc!', () => { expect(Scorer.gradeLabel(95)).toBe('Xuất sắc!') })
  it('85  = Rất tốt!',  () => { expect(Scorer.gradeLabel(85)).toBe('Rất tốt!') })
  it('50  = Cần luyện thêm', () => { expect(Scorer.gradeLabel(50)).toContain('luyện') })
})
